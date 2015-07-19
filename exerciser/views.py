from django.template import RequestContext
from django.shortcuts import render
from django.shortcuts import render_to_response
from exerciser.models import Application, Panel, Document, Change, Step, Explanation, UsageRecord, QuestionRecord, Group, Teacher, Question, Option, Student, AcademicYear, HTMLStep, Example, HTMLExplanation, ExampleQuestion, ExampleOption, OptionComment, ExampleStep
import json 
import simplejson 
import datetime
import string
import random
from random import randint
from django.views.decorators.csrf import requires_csrf_token
import django.conf as conf
from exerciser.forms import UserForm
from django.contrib.auth import authenticate, login
from django.http import HttpResponseRedirect, HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.contrib.auth.models import User
from chartit import DataPool, Chart
from django.db.models import Avg
from django.db.models import Count, Max, Sum, Min
import lxml.html
import xml.etree.ElementTree as ET
import difflib
from difflib import Differ
from pprint import pprint
import lxml.etree as et
import re
from django.utils.html import strip_tags, escape
from xml.sax.saxutils import unescape
from bs4 import BeautifulSoup





def create_student_ids(teacher,group,number_students_needed):
	"""
	Given the number of students required for a group, generate that many unique student ids.
	"""
	created=0
	ids=[]
	while (created < int(number_students_needed)):
		id=random.choice(string.lowercase)
		id+=str(randint(10, 99))
		students=Student.objects.filter(teacher=teacher,group=group,student_id=id)
		if len(students)==0:
			student=Student(teacher=teacher,group=group,student_id=id)
			student.save()
			ids.append(id)
			created += 1


@requires_csrf_token
def log_info_db(request):
	""" 
	This method logs the time spent on a step, when the user moves forwards or backwards to the next/previous step.
	"""
	try:
		time_on_step = request.POST['time']
		current_step = int(request.POST['step'])
		direction = request.POST['direction']
		application_name = request.POST['example_name']
	except KeyError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	session_id = request.session.session_key

	if direction == "back":
		current_step = int(current_step) + 1

	try:
		application = Application.objects.filter(name=application_name)[0]
		step = Step.objects.filter(application=application, order = current_step)[0]

	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
		
	record = UsageRecord(application = application, session_id = session_id, time_on_step = time_on_step, step = step, direction = direction)
	
	teacher_name=request.session.get("teacher",None)
	if teacher_name != None:
	
		user=User.objects.filter(username=teacher_name)
		teacher=Teacher.objects.filter(user=user)
		
		if len(teacher)>0:
			teacher=teacher[0]
			record.teacher = teacher
			group_name=request.session.get("group",None)
			year = request.session.get("year",None)
			if group_name != None and year != None:
				academic_year = AcademicYear.objects.filter(start = year)[0]
				group = Group.objects.filter(teacher=teacher, academic_year = academic_year, name = group_name)
				if len(group) > 0:
					group=group[0]
					record.group = group
					student_name=request.session.get("student", None)
					if student_name != None:
						student = Student.objects.filter(teacher=teacher,group=group,student_id=student_name)
						if len(student) > 0:
							student=student[0]
							record.student = student

	record.save()
	return HttpResponse("{}",content_type = "application/json")

	
	

@requires_csrf_token
def log_question_info_db(request):
	"""
	This method stores the answer chosen for a question at a particular step.
	"""
	
	try:
		time_on_question = request.POST['time']
		current_step = request.POST['step']
		application_name = request.POST['example_name']
		answer_text = request.POST['answer']
		multiple_choice_question = request.POST['multiple_choice']
	except KeyError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	teacher_name=request.session.get("teacher",None)
	session_id = request.session.session_key
	answer_text = answer_text.replace('<', '&lt')
	answer_text = answer_text.replace('>', '&gt')
	try:
		application = Application.objects.filter(name=application_name)[0]
		step = Step.objects.filter(application=application, order=current_step)[0]
		question = Question.objects.filter(step=step)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	usage_record = UsageRecord(application = application, session_id = session_id, time_on_step = time_on_question, step = step, direction = "next")
	question_record=QuestionRecord(application=application,question=question, answer_text=answer_text)
	if multiple_choice_question=="true":
		try:
			answer = Option.objects.filter(question=question,content=answer_text)[0]
		except IndexError:
			return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
		question_record.answer=answer
	if teacher_name != None:
		user=User.objects.filter(username=teacher_name)
		teacher=Teacher.objects.filter(user=user)
		if len(teacher)>0:
			teacher=teacher[0]
			question_record.teacher = teacher
			usage_record.teacher = teacher
			year=request.session.get("year",None)
			group_name=request.session.get("group",None)
			if group_name != None and year != None:
				academic_year = AcademicYear.objects.filter(start=year)
				if len(academic_year) > 0:
					academic_year = academic_year[0]
					group = Group.objects.filter(teacher=teacher, academic_year = academic_year, name = group_name)
					if len(group) > 0:
						group=group[0]
						usage_record.group = group
						question_record.group = group
						
						student_name=request.session.get("student", None)
						if student_name != None:
							student = Student.objects.filter(teacher=teacher,group=group,student_id=student_name)
							if len(student) > 0:
								student=student[0]
								usage_record.student = student
								question_record.student = student
	usage_record.save()
	question_record.save()
	return HttpResponse("{}",content_type = "application/json")
	

def student_group_list(request):
	""" 
	This method retrieves the list of students for a particular group.
	"""
	context = RequestContext(request)
	try:
		group_name = request.GET['group']
		teacher_username = request.GET['teacher']
		selected_year = request.GET['year']
	except KeyError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")

	try:
		user = User.objects.filter(username = teacher_username)[0]
		teacher = Teacher.objects.filter(user=user)[0]
		year = AcademicYear.objects.filter(start=selected_year)[0]
		group=Group.objects.filter(teacher=teacher,name=group_name,academic_year=year)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	students=Student.objects.filter(teacher=teacher,group=group)
	selected_year = selected_year +'/'+ str(int(selected_year)+1)
	request.session['information_shown'] = True
	return render_to_response('exerciser/group_sheet.html', {'students':students, 'group':group_name, 'year':selected_year}, context)
	


@requires_csrf_token
def create_group(request):
	"""
	This method creates a group for a particular teacher and year with the specified number of students.
	"""
	
	success = False
	try:
		teacher_username = request.POST['teacher']
		group_name = request.POST['group']
		selected_year = request.POST['year']
		num_students = request.POST['num_students']
	except KeyError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")
	if num_students == '' or group_name == '':
		return HttpResponse(simplejson.dumps(success), content_type="application/json")
	
	try:
		user = User.objects.filter(username = teacher_username)[0]
		teacher = Teacher.objects.filter(user=user)[0]
		year = AcademicYear.objects.filter(start=selected_year)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")

	if len(Group.objects.filter(teacher=teacher,name=group_name,academic_year=year))==0:
		group = Group(teacher = teacher, name = group_name,academic_year=year)
		group.save()
		create_student_ids(teacher,group,num_students)
		success = True

	return HttpResponse(simplejson.dumps(success),content_type = "application/json")
	

	
@requires_csrf_token
def delete_group(request):
	"""
	This method deletes the group the teacher selected to delete.
	"""
	success = False
	try:
		teacher_username = request.POST['teacher']
		group_name = request.POST['group']
		selected_year = request.POST['year']
	except KeyError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")
	
	try:
		user = User.objects.filter(username = teacher_username)[0]
		teacher = Teacher.objects.filter(user=user)[0]
		year = AcademicYear.objects.filter(start=selected_year)[0]
		group = Group.objects.filter(teacher=teacher,name=group_name,academic_year=year)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")

	group.delete()
	success = True

	return HttpResponse(simplejson.dumps(success),content_type = "application/json")



@requires_csrf_token
def update_group(request):
	"""
	This method adds the required number of students to a selected group
	"""
	
	success = False
	try:
		group_name = request.POST['group']
		teacher_username = request.POST['teacher']
		selected_year = request.POST['year']
		num_students = request.POST['num_students']
	except KeyError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")
	if num_students == '':
		return HttpResponse(simplejson.dumps(success), content_type="application/json")
	try:
		user = User.objects.filter(username = teacher_username)[0]
		teacher = Teacher.objects.filter(user=user)[0]
		year = AcademicYear.objects.filter(start=selected_year)[0]
		group = Group.objects.filter(teacher=teacher,name=group_name,academic_year=year)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")

	create_student_ids(teacher,group,num_students)
	success = True
	return HttpResponse(simplejson.dumps(success),content_type = "application/json")




@requires_csrf_token
def register_group_with_session(request):
	"""
	This method handles registration of a group for a particular teacher.
	"""
	
	success=False
	try:
		teacher_username = request.session['teacher']
		year = request.session['year']
		group_name = request.POST['group']
	except KeyError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")
		
	try:
		user = User.objects.filter(username=teacher_username)[0]
		teacher = Teacher.objects.filter(user=user)[0]
		academic_year = AcademicYear.objects.filter(start=year)[0]
		group = Group.objects.filter(teacher=teacher, academic_year = academic_year, name=group_name)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")
		
	request.session['group'] = group_name
	success = True
	return HttpResponse(simplejson.dumps(success),content_type = "application/json")

	

@requires_csrf_token
def save_session_ids(request):
	""" 
	This method saves the session ids.
	"""
	
	request.session['student_registered']=True
	return HttpResponseRedirect('/weave/')
	
@requires_csrf_token
def group_sheet_confirm(request):
	"""
	This method ensures that the information shown to the teachers explaining that they need to print the table of the students is shown once in a session only.
	"""
	
	request.session['information_seen']=True
	return HttpResponse(simplejson.dumps(True),content_type = "application/json")


@requires_csrf_token
def register_teacher_with_session(request):
	"""
	A function to register the teacher id entered for a pupil
	"""
	success=False
	try:
		teacher_username = request.POST['teacher']
	except KeyError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")
	try:
		user = User.objects.filter(username=teacher_username)[0]
		teacher = Teacher.objects.filter(user=user)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")
	request.session['teacher'] = teacher_username
	success = True
	return HttpResponse(simplejson.dumps(success),content_type = "application/json")



@requires_csrf_token
def register_student_with_session(request):
	"""
	A function to register the student id entered for a pupil
	"""
	success=False
	try:
		student_name = request.POST['student']
		teacher_username = request.session['teacher']
		year = request.session['year']
		group_name = request.session['group']
	except KeyError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")

	try:
		user = User.objects.filter(username=teacher_username)[0]
		teacher = Teacher.objects.filter(user=user)[0]
		academic_year = AcademicYear.objects.filter(start=year)[0]
		group=Group.objects.filter(teacher=teacher, academic_year = academic_year, name=group_name)[0]
		student=Student.objects.filter(teacher=teacher,group=group,student_id=student_name)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")

	request.session['student'] = student_name
	success = True
	return HttpResponse(simplejson.dumps(success),content_type = "application/json")


def get_groups_for_year(request):
	"""
	A function to get the list of groups belonging to a particular teacher for a selected year.
	"""
	try:
		year = request.POST['year']
		teacher_username = request.session['teacher']
	except KeyError:
		return HttpResponse(simplejson.dumps([]), content_type="application/json")
	try:
		user = User.objects.filter(username=teacher_username)[0]
		teacher = Teacher.objects.filter(user=user)[0]
		academic_year=AcademicYear.objects.filter(start=year)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps([]), content_type="application/json")
	groups = Group.objects.filter(teacher=teacher,academic_year = academic_year)
	groups = map(str, groups)
	return HttpResponse(simplejson.dumps(groups), content_type="application/json")


@requires_csrf_token
def register_year_with_session(request):
	"""
	A function to register the year of the group entered for a pupil
	"""
	success=False
	try:
		year = request.POST['year']
		teacher_username = request.session['teacher']
	except KeyError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")

	try:
		academic_year=AcademicYear.objects.filter(start=year)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps(success), content_type="application/json")
	request.session['year'] = year
	success = True
	return HttpResponse(simplejson.dumps(success),content_type = "application/json")
	


@requires_csrf_token
def reset_session(request):
	"""
	A function to reset the session for a pupil.
	"""
	if 'teacher' in request.session:
		del request.session['teacher']
	if 'year' in request.session:
		del request.session['year']
	if 'group' in request.session:
		del request.session['group']
	if 'student' in request.session:
		del request.session['student']
	if 'student_registered' in request.session:
		del request.session['student_registered']
	
	request.session.delete()
	request.session.modified = True
	
	return HttpResponseRedirect('/weave/')
	

	
@requires_csrf_token
def del_session_variable(request):
	"""
	A function to delete a session variable
	"""
	try:
		to_delete=request.POST['to_delete']
	except KeyError:
		return HttpResponseRedirect('/weave/')
	if to_delete in request.session:
		del request.session[to_delete]

	return HttpResponseRedirect('/weave/')
	


def index(request):
	"""
	A function to load the main page for the pupil interface
	"""
	# Request the context of the request.
	# The context contains information such as the client's machine details, for example.
	context = RequestContext(request)

	application_list = Application.objects.all()
	academic_years = AcademicYear.objects.all()
	
	# Construct a dictionary to pass to the template engine as its context.
	# Note the key boldmessage is the same as {{ boldmessage }} in the template!
	context_dict = {'applications' : application_list, 'academic_years':academic_years}

	for application in application_list:
		application.url = application.name.replace(' ', '_')
	
	# Return a rendered response to send to the client.
	# We make use of the shortcut function to make our lives easier.
	# Note that the first parameter is the template we wish to use.
	return render_to_response('exerciser/index.html', context_dict, context)



def application(request, application_name_url):
	"""
	A function to load the viewing page for a selected application. The name of the application is passed as the second parameter of the example.
	"""
	
	context = RequestContext(request)
	if 'student_registered' in request.session:
		

		# Change underscores in the category name to spaces.
		# URLs don't handle spaces well, so we encode them as underscores.
		# We can then simply replace the underscores with spaces again to get the name.
		application_name = application_name_url.replace('_', ' ')

		# Create a context dictionary which we can pass to the template rendering engine.
		# We start by containing the name of the category passed by the user.
		context_dict = {'application_name': application_name}
		
		

		try:

			application = Application.objects.get(name=application_name)
			context_dict['application'] = application
			
			panels = Panel.objects.filter(application = application).order_by('number')
			context_dict['panels'] = panels

			steps = Step.objects.filter(application=application)
			stepChanges = []
			explanations = []
			for step in steps:
				changesToAdd = []
				changes = Change.objects.filter(step = step)
				for change in changes:
					changesFound = change.getChanges()
					for c in changesFound:
						changesToAdd.append(c)
				stepChanges.append(changesToAdd)
				expl = Explanation.objects.filter(step = step)
				for explanation in expl:
					explanations.append(json.dumps((explanation.text).replace('"',"&quot")))
			explanations.append("Example complete! Well done!")

			context_dict['steps'] = json.dumps(stepChanges)
			context_dict['explanations'] = explanations
			size_panels = (100/len(panels))
			context_dict['panel_size'] = str(size_panels)
		except Application.DoesNotExist:
			return HttpResponseRedirect('/weave/')

		# Go render the response and return it to the client.
		return render_to_response('exerciser/application.html', context_dict, context)
	else:
		return HttpResponseRedirect('/weave/')




def get_students(request):
	"""
	A function to get the student ids for the students belonging to a particular group.
	"""
	try:
		group_name=request.GET['group']
		year = request.GET['year']
	except KeyError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
		
	teacher_username = request.user
	try:
		user=User.objects.filter(username=teacher_username)[0]
		teacher=Teacher.objects.filter(user=user)[0]
		academic_year = AcademicYear.objects.filter(start=year)[0]
		selected_group = Group.objects.filter(name = group_name,teacher=teacher,academic_year=academic_year)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")

	students=Student.objects.filter(group=selected_group)
	students = map(str, students)
	return HttpResponse(simplejson.dumps(students), content_type="application/json")
	
	
def get_largest_step(request):
	"""
	A function to get the largest step for a chosen example.
	"""
	try:
		app_name = request.GET['application']
	except KeyError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied in get groups'}), content_type="application/json")
	application = Application.objects.filter(name = app_name)
	total_steps=application.aggregate(num_steps=Count('step'))['num_steps']
	return HttpResponse(simplejson.dumps({'steps':total_steps}), content_type="application/json")
	

def get_groups(request):
	"""
	A function to get the groups of a particular teacher.
	"""
	try:
		year = request.GET['year']
	except KeyError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied in get groups'}), content_type="application/json")
	try:
		year = int(year)
	except ValueError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied Value'}), content_type="application/json")
	
	teacher_username = request.user
	try:
		user=User.objects.filter(username=teacher_username)[0]
		teacher=Teacher.objects.filter(user=user)[0]
		academic_year = AcademicYear.objects.filter(start=year)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")

	groups = Group.objects.filter(teacher=teacher,academic_year=academic_year)
	groups = map(str,groups)
	return HttpResponse(simplejson.dumps(groups), content_type="application/json")
	

def get_steps(request):
	"""
	A function to get the steps of a selected example.
	"""
	try:
		app_name = request.GET['app_name']
	except KeyError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	
	try:
		application = Application.objects.filter(name=app_name)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")

	steps = Step.objects.filter(application=application)
	steps = map(str,steps)
	return HttpResponse(simplejson.dumps(steps), content_type="application/json")


# Use the login_required() decorator to ensure only those logged in can access the view.
@login_required		
def get_question_data(request):
	"""
	A function to get the data recorded for answers of a question of a particular example. It only retrieves information about a selected group belonging to the logged in teacher.
	"""
	app_name=request.GET.get('app_name',None)
	year=request.GET.get('year',None)
	group_name=request.GET.get('group',None)
	step_num=request.GET.get('step',None)
	question_text=request.GET.get('question',None)
	student_id=request.GET.get('student',None)
	# Check for invalid request
	if (app_name is None or year is None or group_name is None) or (step_num is None and question_text is None):
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	teacher_username = request.user
	try:
		user=User.objects.filter(username=teacher_username)[0]
		teacher=Teacher.objects.filter(user=user)[0]
		academic_year = AcademicYear.objects.filter(start=year)[0]
		group = Group.objects.filter(name = group_name,teacher=teacher,academic_year=academic_year)[0]
		application=Application.objects.filter(name=app_name)[0]
		if question_text is not None:
			question=Question.objects.filter(application=application,question_text=question_text)[0]
		if student_id is not None:
			student=Student.objects.filter(teacher=teacher,group=group,student_id=student_id)[0]
		if step_num is not None:
			step=Step.objects.filter(application=application,order=step_num)[0]
			question=Question.objects.filter(application=application,step=step)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
		

	selected_data={}
	quest_text=question.question_text
	all_options=Option.objects.filter(question=question)
	if len(all_options) == 0:
		return HttpResponse(simplejson.dumps({'open_question':True}), content_type="application/json")
	question_records = QuestionRecord.objects.filter(application=application, question=question, teacher=teacher,group=group)
	if student_id is not None:
		question_records=question_records.filter(student=student)
	if len(question_records) == 0:
		selected_data["no_data"] = "True"
		return HttpResponse(simplejson.dumps(selected_data), content_type="application/json")

	sd=[]

	for option in all_options:
		records_for_option=question_records.filter(answer=option)
		times_chosen=len(records_for_option)
		student_list=[]
		if student_id is None:
			for record in records_for_option:
				if record.student != None:
					stud_id=record.student.student_id
					if stud_id not in student_list:
						student_list.append(stud_id)
		else:
			student_list.append(student_id)
		sd.append({option.content:times_chosen,'students':student_list})
	selected_data['question']=quest_text
	selected_data['data']=sd
	return HttpResponse(simplejson.dumps(selected_data), content_type="application/json")	

	
def update_time_graph(request):
	"""
	A function to retrieve the data for the time spent at each step of an example.
	If no student ID is passed, then you produce data for an group average graph.
	Otherwise, you get the total time for the student.
	"""
	app_name=request.GET.get('app_name', None)
	group_name=request.GET.get('group', None)
	year = request.GET.get('year', None)		
	student_id = request.GET.get('student', None)
	
	if app_name is None or group_name is None or year is None:
	    return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	
	teacher_username = request.user
	
	try:
		user=User.objects.filter(username=teacher_username)[0]
		teacher=Teacher.objects.filter(user=user)[0]
		academic_year = AcademicYear.objects.filter(start=year)[0]
		selected_group = Group.objects.filter(name = group_name,teacher=teacher,academic_year=academic_year)[0]
		selected_application=Application.objects.filter(name=app_name)[0]
		
		if student_id is not None:
			student = Student.objects.filter(student_id=student_id)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	
	selected_data={}
	usage_records = UsageRecord.objects.filter(application=selected_application,teacher=teacher,group=selected_group)
	if student_id is not None:
		usage_records = UsageRecord.objects.filter(application=selected_application,teacher=teacher,group=selected_group, student = student)
	else:
		usage_records = UsageRecord.objects.filter(application=selected_application,teacher=teacher,group=selected_group)
	if len(usage_records) == 0:
		selected_data["no_data"] = "True"
		return HttpResponse(simplejson.dumps(selected_data), content_type="application/json")

	question_steps=[]
	app_questions=Question.objects.filter(application=selected_application)
	for question in app_questions:
		question_steps.append(question.step.order)
	sd=[]
	#### Getting averages ##########
	steps = Step.objects.filter(application=selected_application)
	num_steps = steps.aggregate(max = Max('order'))
	if num_steps['max'] != None:
		for step_num in range(1, num_steps['max']+1):
			explanation_text=""
			step=steps.filter(order=step_num)
			if len(step)>0:
				step=step[0]
				explanation=Explanation.objects.filter(step=step)
				if len(explanation)>0:
					explanation=explanation[0]
					if explanation.text == "No explanation":
						explanation_text = "Click to see answers"
					else:
						explanation_text = explanation.text
					if len(explanation_text)<100:
						explanation_text_start=explanation_text[:len(explanation_text)]
					else:
						explanation_text_start=explanation_text[:100]

				records = usage_records.filter(step = step)
				
				# If student ID is none, assume an average result, else SUM everything
				if student_id is None:
					time = records.aggregate(time = Avg('time_on_step'))
				else:
					time = records.aggregate(time = Sum('time_on_step'))

				revisited_steps_count=len(records.filter(direction="back"))
				sd.append({"y":time['time'],"revisited_count":revisited_steps_count,"explanation":explanation_text,"explanation_start":explanation_text_start})
	if sd!=[]:
		selected_data["data"]=sd
		selected_data["question_steps"]=question_steps

	return HttpResponse(simplejson.dumps(selected_data), content_type="application/json")
	

def update_class_steps_graph(request):
	"""
	A function to retrieve the data needed for the class steps graph.
	"""
	try:
		app_name=request.GET['application']
		group_name=request.GET['group']
		year = request.GET['year']
		step_num=request.GET['step']
	except KeyError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	if step_num == 'NaN':
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	teacher_username = request.user
	try:
		user=User.objects.filter(username=teacher_username)[0]
		teacher=Teacher.objects.filter(user=user)[0]
		academic_year = AcademicYear.objects.filter(start=year)[0]
		selected_group = Group.objects.filter(name = group_name,teacher=teacher,academic_year=academic_year)[0]
		application=Application.objects.filter(name=app_name)[0]
		step = Step.objects.filter(application=application, order = step_num)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	selected_data={}
	sd=[]
	usage_records = UsageRecord.objects.filter(application=application,teacher=teacher,group=selected_group,step=step)
	if len(usage_records) == 0:
		return HttpResponse(simplejson.dumps({'no_data': True}), content_type="application/json")

	for record in usage_records:
		if record.student != None:
			sd.append({record.student.student_id:record.time_on_step})
	selected_data["data"]=sd

	return HttpResponse(simplejson.dumps(selected_data), content_type="application/json")



def populate_summary_table(request):
	"""
	A function to get the data for the class summary table.
	"""
	try:
		application=request.GET['application']
		academic_year=request.GET['year']
		group_name=request.GET['group']
	except KeyError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	teacher_username = request.user
	try:
		user=User.objects.filter(username=teacher_username)[0]
		teacher=Teacher.objects.filter(user=user)[0]
		year=AcademicYear.objects.filter(start=academic_year)[0]
		selected_application=Application.objects.filter(name=application)
		total_steps=selected_application.aggregate(num_steps=Count('step'))['num_steps']
		selected_application = selected_application[0]
		group = Group.objects.filter(name = group_name,teacher=teacher,academic_year=year)[0]

	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	selected_data={}

	students=Student.objects.filter(teacher=teacher,group=group)

	for student in students:
		student_id=student.student_id

		student_records=UsageRecord.objects.filter(application=selected_application,teacher=teacher,group=group,student=student)
		last_step_reached=student_records.aggregate(last_step=Max('step_number'))
		if last_step_reached['last_step'] == None:
			last_step_reached = 0
		else:
			last_step_reached = last_step_reached['last_step']

		total_app_time=student_records.aggregate(time_on_step=Sum('time_on_step'))
		if total_app_time['time_on_step'] == None:
			total_app_time = 0
		else: 
			total_app_time = total_app_time['time_on_step']

		revisited_steps_count=student_records.filter(direction='back').aggregate(count_revisits=Count('id'))['count_revisits']

		selected_data[student_id]={'last_step':last_step_reached,'total_time':total_app_time,'num_steps_revisited':revisited_steps_count}
	return HttpResponse(simplejson.dumps({"selected_data":selected_data,"total_steps":total_steps}), content_type="application/json")	

def get_application_questions(request):
	"""
	A function to get the questions for a selected example.
	"""
	try:
		application = request.GET['application']
	except KeyError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	try:
		selected_application = Application.objects.filter(name=application)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	questions = Question.objects.filter(application=application)
	questions = map(str, questions)
	return HttpResponse(simplejson.dumps(questions), content_type="application/json")


@requires_csrf_token
def teacher_interface(request):
	"""
	A function to load the main page for the teacher interface.
	"""
	# Request the context of the request.
	# The context contains information such as the client's machine details, for example.
	context = RequestContext(request)

	application_list = Application.objects.all()
	academic_years = AcademicYear.objects.all()

	user_form = UserForm()

	groups={}

	if request.user.is_authenticated():

		teacher_username = request.user
		user = User.objects.filter(username=teacher_username)
		teacher = Teacher.objects.filter (user=user)
		for academic_year in academic_years:
			group_objects = Group.objects.filter(teacher=teacher, academic_year=academic_year)
			group_names=[]
			for group in group_objects:
				group_names.append(str(group.name))
			groups[academic_year.start]= group_names

	context_dict = {'applications' : application_list,'user_form': user_form, 'groups': groups,'academic_years':academic_years}
	
	
	# Return a rendered response to send to the client.
	# We make use of the shortcut function to make our lives easier.
	# Note that the first parameter is the template we wish to use.
	return render_to_response('exerciser/teacher_interface.html', context_dict, context)




def register(request):
	"""
	A function to deal with the registration of a new teacher.
	"""
	
	# Like before, get the request's context.
	context = RequestContext(request)

	# A boolean value for telling the template whether the registration was successful.
	# Set to False initially. Code changes value to True when registration succeeds.
	registered = False

	# If it's a HTTP POST, we're interested in processing form data.
	if request.method == 'POST':
		# Attempt to grab information from the raw form information.
		# Note that we make use of both UserForm and UserProfileForm.
		user_form = UserForm(data=request.POST)

		# If the form is valid...
		if user_form.is_valid():
			# Save the user's form data to the database.
			try:
				user = user_form.save()
			except ValueError:
				pass
			# Now we hash the password with the set_password method.
			# Once hashed, we can update the user object.
			password = user.password
			user.set_password(password)
			user.save()
			teacher=Teacher(user=user)
			try:
				can_analyse=bool(request.POST['can_analyse'])
				teacher.can_analyse=can_analyse
			except KeyError:
				pass
			except ValueError:
				pass
			teacher.save()

			# Update our variable to tell the template registration was successful.
			registered = True

		# Invalid form - mistakes or something else?
		# Print problems to the terminal.
		# They'll also be shown to the user.
		else:
			print user_form.errors

	request.session['registered'] = registered
	# Render the template depending on the context.
	return HttpResponseRedirect('/weave/teacher_interface')
	


def user_login(request):
	"""
	A function for logging in of the user.
	"""
	# Like before, obtain the context for the user's request.
	context = RequestContext(request)
	# If the request is a HTTP POST, try to pull out the relevant information.
	successful_login = False

	if request.method == 'POST':
		# Gather the username and password provided by the user.
		# This information is obtained from the login form.
		username = request.POST['username']
		password = request.POST['password']

		# Use Django's machinery to attempt to see if the username/password
		# combination is valid - a User object is returned if it is.
		user = authenticate(username=username, password=password)

		# If we have a User object, the details are correct.
		# If None (Python's way of representing the absence of a value), no user
		# with matching credentials was found.
		if user:
			# Is the account active? It could have been disabled.
			if user.is_active:
				# If the account is valid and active, we can log the user in.
				# We'll send the user back to the homepage.
				login(request, user)
				successful_login = True
				try:
					teacher=Teacher.objects.filter(user=user)[0]
				except IndexError:
					pass
					

	request.session['successful_login'] = successful_login
	return HttpResponseRedirect('/weave/teacher_interface')

# Use the login_required() decorator to ensure only those logged in can access the view.
@login_required
def statistics(request):
	"""
	A function to load the page with the pupils' progress- the graphs page in the teacher interface.
	"""
	context = RequestContext(request)
	teacher_username = request.user
	try:
		user = User.objects.filter(username=teacher_username)[0]
		teacher = Teacher.objects.filter (user=user)[0]
	except IndexError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	applications = Application.objects.all();
	academic_years=AcademicYear.objects.all()
	application_names=[]
	questions={}
	for application in applications:
		application_names.append(str(application.name))
		
		app_questions = Question.objects.filter(application=application)
		if len(app_questions)>0:
			questions_text=[]
			for app_question in app_questions:
				questions_text.append(app_question.question_text)
			questions[application.name]=questions_text


	context_dict = {'application_names' : application_names, 'app_questions_dict' : simplejson.dumps(questions), 'academic_years': academic_years}
	return render_to_response('exerciser/graph_viewer.html', context_dict, context)

# Use the login_required() decorator to ensure only those logged in can access the view.
@login_required
def user_logout(request):
	"""
	A function to log out a teacher.
	"""
	# Since we know the user is logged in, we can now just log them out.
	logout(request)

	# Take the user back to the homepage.
	return HttpResponseRedirect('/weave/teacher_interface')


@requires_csrf_token
def author_interface(request):
	"""
	A function to load the main page for the author interface.
	"""
	# Request the context of the request.
	# The context contains information such as the client's machine details, for example.
	context = RequestContext(request)

	
	# Return a rendered response to send to the client.
	# We make use of the shortcut function to make our lives easier.
	# Note that the first parameter is the template we wish to use.
	return render_to_response('exerciser/author_interface.html', {}, context)


@requires_csrf_token
def example_creator(request):
	"""
	A function to load the main page for the example creator page.
	"""
	# Request the context of the request.
	# The context contains information such as the client's machine details, for example.
	context = RequestContext(request)

	
	# Return a rendered response to send to the client.
	# We make use of the shortcut function to make our lives easier.
	# Note that the first parameter is the template we wish to use.


	# Ensure panels corresponds to something meaningful
	return render_to_response('exerciser/example_creator.html', {'panels':range(0,3)}, context)

	# A method to create a new html explanation
@requires_csrf_token
def create_example(request):
	try:
		example_name = request.POST['example_name']
		number_of_panels = request.POST['number_of_panels']
	except KeyError:
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	
	example = Example.objects.filter(name=example_name)
	if len(example) != 0:
		# such example already exists so to avoid overwriting of it ask the user for another name
		return HttpResponse(simplejson.dumps({'disallowed': True}), content_type="application/json")
	else: 
		example = Example(name = example_name, number_of_panels = number_of_panels)
		example.save()
	return HttpResponse("{}",content_type = "application/json")


	# A method to create a new html explanation
@requires_csrf_token
def save_explanation(request):
	print "in save explanation"
	try:
		html = request.POST['html']
		example_name = request.POST['example_name']
		step_number = request.POST['step_number']
	except KeyError:
		print "key error in save explanation"
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
		
	try:
		example = Example.objects.filter(name=example_name)[0]

	except IndexError:
		print "index error in save explanation"
		return HttpResponse(simplejson.dumps({'error':'Inexistent application'}), content_type="application/json")
	print "explanation html ", html
	html_explanation = HTMLExplanation.objects.get_or_create(example = example, step_number = step_number)[0]
	html_explanation.html = html
	html_explanation.save() #Save the changes
	return HttpResponse("{}",content_type = "application/json")
"""
# A method to create a new html step
@requires_csrf_token
def save_step2(request):
	print "in save steppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp"

	try:
		html = request.POST['html']
		example_name = request.POST['example_name']
		step_number = request.POST['step_number']
		panel_id = request.POST['panel_id']
	except KeyError:
		print "key error in save step"
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
		
	try:
		print example_name
		example = Example.objects.filter(name=example_name)[0]

	except IndexError:
		print "index error in save step"
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	print "step html ", html
	print "step number ",	step_number
	print "panel_id ",  panel_id
	HTMLStep.objects.filter(example = example, step_number = step_number, panel_id = panel_id).delete()
	html_step = HTMLStep.objects.get_or_create(example = example, step_number = step_number, panel_id = panel_id)[0]
	html_step.html = html
	html_step.save() #Save the changes
	return HttpResponse("{}",content_type = "application/json")# A method to create a new html step
"""
def save_panel_text(html, example_name, step_number, panel_id):
	example = Example.objects.filter(name=example_name)
	if len(example) > 0:
		example = example[0]
		HTMLStep.objects.filter(example = example, step_number = step_number, panel_id = panel_id).delete()
		html_step = HTMLStep.objects.get_or_create(example = example, step_number = step_number, panel_id = panel_id)[0]
		html_step.html = html
		html_step.save() #Save the changes

# A method to create a new html step
@requires_csrf_token
def save_step_texts(request):
	print "in save step texts"

	try:
		example_name = request.POST['example_name']
		step_number = request.POST['step_number']
		panel_texts = json.loads(request.POST['panel_texts'])
	except KeyError:
		print "key error in save step texts"
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")

	print "step number ",	step_number
	for panel_id in panel_texts:
		html = panel_texts[panel_id]
		save_panel_text(html, example_name, step_number,panel_id)

		"""
		print panel_id, "PANEEEEEEEEEEEEEEEEEEEEEEEEEEEEELLLLLLLLLLLLLLLLLL"
		html = panel_texts[panel_id]
		html_step = HTMLStep.objects.get_or_create(example = example, step_number = step_number, panel_id = panel_id)[0]
		html_step.html = html
		html_step.save() #Save the changes
		"""

	return HttpResponse("{}",content_type = "application/json")# A method to create a new html step


# A method to create a new html step
@requires_csrf_token
def save_question(request):
	print "in save question"

	try:
		question_text = request.POST['question_text']
		print question_text, "QUESTION TEXT"
		question_type = request.POST['question_type']
		print question_type, "QUESTION TYPE"
		example_name = request.POST['example_name']
		print example_name, "EXAMPLE NAME"
		step_number = request.POST['step_number']
		print step_number, "STEP NUMBER"
		options = json.loads(request.POST['options'])['options']
		print options, "DETAILSSSSSSSSSSS"

	except KeyError:
		print "key error in save question"
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
		
	try:
		print example_name
		example = Example.objects.filter(name=example_name)[0]

	except IndexError:
		print "index error in save question"
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	print "question step html ", question_text
	print "question step number ",	step_number
	question = ExampleQuestion.objects.get_or_create(example = example, step_number = step_number)[0]
	question_options = ExampleOption.objects.filter(question = question).delete()
	question.question_text = question_text
	question.kind = question_type 
	question.save()
	for index in range(len(options)):
		print index, " heeeere"
		option = options[index]
		option_text = option['option_text']
		is_correct = option['correct']
		opt = ExampleOption.objects.get_or_create(question = question, option_text = option_text, number = index)[0]
		opt.correct = is_correct
		opt.save()
		if "comment" in option:
			comment_text = option['comment']
			option_comment = OptionComment.objects.get_or_create(option = opt, comment = comment_text)
	return HttpResponse("{}",content_type = "application/json")


def get_next_step(request):
	print "in get next step"
	context = RequestContext(request)
	# Get the requested example and step number
	try:
		example_name = request.GET['example_name']
		step_number = int(request.GET['step_number'])
	except KeyError:
		print "key error in get next step"
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")

	try:
		example = Example.objects.filter(name = example_name)[0]
	except IndexError:
		print "index error in get next step"
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")


	html_steps = HTMLStep.objects.filter(example = example, step_number = step_number)
	html_explanation = HTMLExplanation.objects.filter(example = example, step_number = step_number)
	question = ExampleQuestion.objects.filter(example = example, step_number = step_number)
	step_entry= {}
	number_of_panels = example.number_of_panels
	# Add the panel and the html for the panel in format panel_id:html- this will be directly used in the js
	for i in range (number_of_panels):
		panel_id = "area" + str(i)
		panel_entry = html_steps.filter(panel_id = panel_id)
		if len(panel_entry) > 0:
			# there has been a text saved for this panel so return the first one
			step_entry[panel_id] = panel_entry[0].html
			print "something in panel exists"
		else:
			previous_html_steps = HTMLStep.objects.filter(example = example, step_number = step_number - 1,panel_id = panel_id)
			if len(previous_html_steps) > 0:
				step_entry[panel_id] = previous_html_steps[0].html
			else:
				# there was no previously inserted text for this panel so return empty string
				step_entry[panel_id] = ""
				print "nothing in panel exists"
	# Add the html for the explanation if it existed else add an empty string
	if len(html_explanation) > 0:
		step_entry["explanation_area"] = html_explanation[0].html
		print "explanation exists"
	else:
		step_entry["explanation_area"] = ""
		print "no explanation exists"
	if len(question) > 0:
		question = question[0]
		print "QUESTIOOOOOON" , question.question_text
		step_entry["question_text"] = question.question_text
		step_entry["question_type"] = question.kind
		options = ExampleOption.objects.filter(question = question)
		question_options = []
		for i in range(0, len(options)):
			print i
			print len(options)
			print options[i].option_text
			option = options[i]
			question_options.append({"option_text" : option.option_text, "correct": option.correct})
			option_comment = OptionComment.objects.filter(option = option)
			if len(option_comment) > 0:
				option_comment = option_comment[0]
				question_options[len(question_options) - 1]["comment"] = option_comment.comment
		step_entry["options"] = question_options
		"""
		correct_answer_comment = CorrectAnswerComment.objects.filter(question = question)
		
		if len(correct_answer_comment) > 0:
			step_entry["correct_answer_comment"] = correct_answer_comment[0].comment
		else:
			step_entry["correct_answer_comment"] = ""
		wrong_answer_comment = WrongAnswerComment.objects.filter(question = question)
		if len(wrong_answer_comment) > 0:
			step_entry["wrong_answer_comment"] = wrong_answer_comment[0].comment
		else:
			step_entry["wrong_answer_comment"] = ""
		general_comment = GeneralComment.objects.filter(question = question)
		if len(general_comment)  > 0:
			step_entry["general_comment"] = general_comment[0].comment
		else:
			step_entry["general_comment"] = ""
		step_entry["options"] = simplejson.dumps(question_options)
		print step_entry["options"], "STEP ENTRY OPTIONS "
		"""
	#else:
	#	step_entry["question_text"] = ""
	#	print "NOT A QUESTIOOOOOON"
	# first find the differences in the plain text
	# second find the 
	#print(result)
	

	"""
	#for r in result:
	#	if r[0] == ' ' or r[0] == '+':
	#		print r[1:]
	test0 = '<span style="line-height: 15.3999996185303px;">this is step 2-panel 3</span><br>'
	plain_test0 = lxml.html.fromstring(test0).text_content()
	test = '<span style="line-height: 15.3999996185303px;">thi<span style="background-color: rgb(25, 7, 7);">s is a new step 2-pa</span>nel 3</span>'
	plain_test = lxml.html.fromstring(test).text_content()
	r = list(d.compare(plain_test0.split(),plain_test.split()))
	#print r
	#l = list(d.compare(test.split(),plain_test.split()))
	##print l

	combination = ""
	#doc = et.fromstring(test)
	for word in r:
		print word
		if word[0] is '+':
			print "had +"
			word = word[1:]
			combination += word;
		else:
			if combination != '':
				test = test.replace(combination, ('<div class ="style">' + combination + '</div>'))
				combination = ""
			else:
				print "combination empty"
	#print et.tostring(doc,pretty_print=True), "looookkkkkkkkkkkkkkkkkkkkkkkkkk"


	print test, "cheeeeeeeeeeeeeeeck"
	
	soup = BeautifulSoup(test, "lxml")

	for div in soup.findAll('div', 'style'):
		div.replaceWithChildren()
	print soup
	"""

	return HttpResponse(simplejson.dumps(step_entry), content_type="application/json")

@requires_csrf_token
def edit_step(request):
	print "in edit step"
	try:
		example_name = request.POST['example_name']
		panel_id = request.POST['panel_id']
		step_number = request.POST['step_number']
		html = request.POST['html']
	except KeyError:
		print "key error in edit step"
		return HttpResponse(simplejson.dumps({"error" : "Bad input supplied"}),content_type = "application/json")
	save_panel_text(html, example_name, step_number, panel_id)
	return HttpResponse(simplejson.dumps({}),content_type = "application/json")

@requires_csrf_token
def edit_steps(request):
	print "in edit steps"
	try:
		panel_id = request.POST['panel_id']
		step_number = int(request.POST['step_number'])
		print panel_id, "iddddddddddddddddddddddddddddddddddddddd"
		raw_new_text = request.POST['new_text']
		raw_text_to_change = request.POST['text_to_change']
		plain_text_to_change = lxml.html.fromstring(raw_text_to_change).text_content()
		print raw_text_to_change, " RAW"
		print plain_text_to_change, " PLAIN"
	except KeyError:
		print "key error in edit steps"		
		return HttpResponse(simplejson.dumps({"error" : "Bad input supplied"}),content_type = "application/json")
	exact_matches = []
	possible_matches = []
	all_matches = []
	if plain_text_to_change != "":
		example_name = request.POST['example_name']
		try:
			example = Example.objects.filter(name = example_name)[0]
		except KeyError:
			print "key error in edit steps"
			return HttpResponse(simplejson.dumps({"error" : "Bad input supplied"}),content_type = "application/json")
		this_step = HTMLStep.objects.filter(example = example, step_number = step_number)
		if len(this_step) > 0:
			this_step = this_step[0]
			this_step_new_text = this_step.html.replace(raw_text_to_change, raw_new_text)
			save_panel_text(this_step_new_text, example_name, step_number, panel_id)
		steps = HTMLStep.objects.filter(example = example, panel_id = panel_id).order_by('step_number')
		for step in steps:
			if step.step_number != step_number:
				raw_step_html = step.html;
				plain_step_html = lxml.html.fromstring(step.html).text_content()
				proposed_text = None
				if raw_text_to_change in raw_step_html:
					proposed_text = raw_step_html.replace(raw_text_to_change, raw_new_text)
					exact_matches.append({"example": example_name, "step_number" :step.step_number, "html" : step.html, "proposed_text" : proposed_text, "panel_id" : step.panel_id})
				elif plain_text_to_change in plain_step_html:
					plain_new_text = keeptags(raw_new_text,"br div")
					proposed_text = plain_step_html.replace(plain_text_to_change, raw_new_text)
					possible_matches.append({"example": example_name, "step_number" :step.step_number, "html" : step.html, "proposed_text" : proposed_text, "panel_id" : step.panel_id})
				print raw_step_html, " raw step"
				print plain_step_html, " plain step"
				if proposed_text is not None:
					all_matches.append({"example": example_name, "step_number" :step.step_number, "html" : step.html, "proposed_text" : proposed_text, "panel_id" : step.panel_id})
		print exact_matches, " EXACT"
		print possible_matches, " possible"				
	return HttpResponse(simplejson.dumps({"exact_matches" : exact_matches, "possible_matches" : possible_matches, "all_matches" : all_matches}),content_type = "application/json")




# A method to create a new html step
@requires_csrf_token
def create_step(request):
	print "in create step"

	try:
		example_name = request.POST['example_name']
		step_number = int(request.POST['step_number'])
		panel_texts = json.loads(request.POST['panel_texts'])
		explanation = request.POST['explanation']
		insert_after = json.loads(request.POST['insert_after'])
		insert_before = json.loads(request.POST['insert_before'])
	except KeyError:
		print "key error in save step texts"
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	try:
		example = Example.objects.filter(name=example_name)[0]

	except IndexError:
		print "index error in save explanation"
		return HttpResponse(simplejson.dumps({'error':'Inexistent application'}), content_type="application/json")
	if step_number >= 0:
		if insert_after:
			# move each of the following steps by 1 step forward
			# when it should be > step_number use step_number + 1!
			update_step_number_after_insertion(example, (step_number + 1))

		# save the new step panel texts
		for panel_id in panel_texts:

			html = panel_texts[panel_id].replace("&nbsp;", " ")

			# new code to deal with automatic highlighting
			soup = BeautifulSoup(html, "lxml")
			for div in soup.findAll('span', 'style'):
				div.replaceWithChildren()
			for div in soup.findAll('html', ''):
				div.replaceWithChildren()
			for div in soup.findAll('body', ''):
				div.replaceWithChildren()
			for div in soup.findAll('p', ''):
				div.replaceWithChildren()
			print soup, "souppppppppppppppppppppp"
			html = str(soup)
					
			# check the code with the previous 
			#current_step_text = lxml.html.fromstring(html).text_content().split()
			current_step_text = keeptags(html,"div").replace("<div>", " <div> ").replace("</div>", " </div> ").split()
			previous_step_text = []
			previous_step_number = step_number - 1
			while previous_step_number >= 0 and previous_step_text == []:
				previous_step = HTMLStep.objects.filter(example = example, step_number = previous_step_number, panel_id = panel_id)
				if len(previous_step) != 0:
					#print "there was a previous step"
					#previous_step_text = lxml.html.fromstring(previous_step[0].html).text_content().split()
					previous_step_text = keeptags(previous_step[0].html,"div").replace("<div>", " <div> ").replace("</div>", " </div> ").split()
				previous_step_number -= 1
			#print previous_step_text, "previous step text"
			if len(previous_step_text) == 0:
				#print "previous step was empty"
				html = '<span class ="style" style = "background-color:red;">' + html+ '</span>'
			else:
				d = Differ()
				comparison_result = list(d.compare(previous_step_text, current_step_text))
				print comparison_result, "interestedddddddddddddddddddddddddddddddddd"
				combination = ""
				after_div_tag = False
				#doc = et.fromstring(test)
				for word in comparison_result:
					print "woooooooooooooooooooooooordddddddddddd", word, "woooooooooooooooooooooooordddddddddddd"
					if word[0] == '+' and "<div>" not in word and "</div>" not in word:
						print "had +"
						if not after_div_tag:
							print "not after div"
							word = word[1:]
						else:
							print "after div"
							word = word[2:]	# the div tag added an extra space in front
						combination += word;
					else:
						if combination != "":
							print "combination NOT empty", len(combination), combination
							#print html
							#combination = combination.replace(" <div> ","<div>").replace(" </div> ", "</div>").replace(" </div>", "</div>").replace("<div></div>", "<div><br></div>")
							#print "combination NOT empty", combination
							html = html.replace(combination, ('<span class ="style" style = "background-color:red;">' + combination + '</span>'))
							print html
							combination = ""
						else:
							print "combination empty"
					if "<div>" not in word and "</div>" not in word:
						after_div_tag = False
					else:
						print "after div"
						after_div_tag = True
				if combination != "":
					print "combination NOT empty2", len(combination)
					print html
					#combination = combination.replace(" <div> ","<div>").replace(" </div> ", "</div>").replace(" </div>","</div>").replace("<div></div>", "<div><br></div>")
					#print "combination NOT empty2", combination
					html = html.replace(combination, ('<span class ="style" style = "background-color:red;">' + combination + '</span>'))
					print html
					combination = ""


			save_panel_text(html, example_name, step_number,panel_id)

		# save the new step explanation

		#print "explanation html ", html
		html_explanation = HTMLExplanation.objects.get_or_create(example = example, step_number = step_number)[0]
		html_explanation.html = explanation
		html_explanation.save() #Save the changes


		if insert_before:
			update_step_number_after_insertion(example, step_number)


	return HttpResponse("{}",content_type = "application/json")# A method to create a new html step


# A method to create a new html step
@requires_csrf_token
def create_question(request):
	print "in create question"

	try:
		question_text = request.POST['question_text']
		question_type = request.POST['question_type']
		example_name = request.POST['example_name']
		step_number = int(request.POST['step_number'])
		options = json.loads(request.POST['options'])['options']
		insert_after = json.loads(request.POST['insert_after'])
		insert_before = json.loads(request.POST['insert_before'])

	except KeyError:
		print "key error in save question"
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
		
	try:
		example = Example.objects.filter(name=example_name)[0]
	except IndexError:
		print "index error in save question"
		return HttpResponse(simplejson.dumps({'error':'Bad input supplied'}), content_type="application/json")
	if step_number >= 0:
		if insert_after:
			# move each of the following steps by 1 step forward
			# when it should be > step_number use step_number + 1!
			update_step_number_after_insertion(example, (step_number + 1))

		# create a new question step
		question = ExampleQuestion.objects.get_or_create(example = example, step_number = step_number)[0]
		
		# delete any previously existing options to ensure only the new options are there
		ExampleOption.objects.filter(question = question).delete()

		question.question_text = question_text
		question.kind = question_type 
		question.save()

		# save the options provided by the author
		for index in range(len(options)):
			option = options[index]
			option_text = option['option_text']
			is_correct = option['correct']
			opt = ExampleOption.objects.get_or_create(question = question, option_text = option_text, number = index)[0]
			opt.correct = is_correct
			opt.save()

			# save comments for the option if any was provided
			if "comment" in option:
				comment_text = option['comment']
				option_comment = OptionComment.objects.get_or_create(option = opt, comment = comment_text)

		if insert_before:
			update_step_number_after_insertion(example, step_number)

	return HttpResponse("{}",content_type = "application/json")


def update_step_number_after_insertion(example, step_number):
	following_steps = ExampleStep.objects.filter(example = example, step_number__gte = step_number)
	for following_step in following_steps:
		print following_step.step_number
		following_step.step_number = following_step.step_number + 1
		following_step.save()


@requires_csrf_token
def delete_step(request):
	print "in delete steppp"
	try:
		example_name = request.POST['example_name']
		step_number = int(request.POST['step_number'])
	except KeyError:
		print "key error in delete step"
		return HttpResponse(simplejson.dumps({"error" : "Bad input supplied"}),content_type = "application/json")
	try:
		example = Example.objects.filter(name = example_name)[0]
	except IndexError:
		print "index error in delete step"
		return HttpResponse(simplejson.dumps({"error" : "Bad input supplied"}),content_type = "application/json")
	ExampleStep.objects.filter(example = example, step_number = step_number).delete()
	steps = ExampleStep.objects.filter(example = example)
	for step in steps:
		if step.step_number > step_number:
			step.step_number = step.step_number - 1
			step.save()
	return HttpResponse("{}",content_type = "application/json")

@requires_csrf_token
def check_steps(request):
	print "in check steppps"
	try:
		example_name = request.GET['example_name']
		step_number = int(request.GET['step_number'])
	except KeyError:
		print "key error in delete step"
		return HttpResponse(simplejson.dumps({"error" : "Bad input supplied"}),content_type = "application/json")
	try:
		example = Example.objects.filter(name = example_name)[0]
	except IndexError:
		print "index error in delete step"
		return HttpResponse(simplejson.dumps({"error" : "Bad input supplied"}),content_type = "application/json")
	previous_steps = ExampleStep.objects.filter(example = example, step_number__lt = step_number)
	next_steps = ExampleStep.objects.filter(example = example, step_number__gt = step_number)
	return HttpResponse(simplejson.dumps({"previous_steps" : len(previous_steps), "next_steps" : len(next_steps)}),content_type = "application/json")







def example_editor(request):
	"""
	A function to load the example editor page for the author interface
	"""
	# Request the context of the request.
	# The context contains information such as the client's machine details, for example.
	context = RequestContext(request)

	example_list = Example.objects.all()
	
	# Construct a dictionary to pass to the template engine as its context.
	# Note the key boldmessage is the same as {{ boldmessage }} in the template!
	context_dict = {'examples' : example_list}

	for example in example_list:
		example.url = example.name.replace(' ', '_')
	
	# Return a rendered response to send to the client.
	# We make use of the shortcut function to make our lives easier.
	# Note that the first parameter is the template we wish to use.
	return render_to_response('exerciser/example_editor.html', context_dict, context)


def edit_example(request, example_name_url):

	# A function to load the editing page for a selected example. The name of the example is passed as the second parameter of the method.
	
	
	context = RequestContext(request)
	
	## !!!!!!!!!!!!!! check if the author is authenticeted/has the permission to edit this example !!!!!!!!!!!!!!
	##if 'student_registered' in request.session:
		

	# Change underscores in the category name to spaces.
	# URLs don't handle spaces well, so we encode them as underscores.
	# We can then simply replace the underscores with spaces again to get the name.
	example_name = example_name_url.replace('_', ' ')

	# Create a context dictionary which we can pass to the template rendering engine.
	# We start by containing the name of the category passed by the user.
	context_dict = {'example_name': example_name}

	try:

		example = Example.objects.get(name=example_name)
		context_dict['example'] = example
		
		# Get how many panels there are
		# when the request is done- create the panels and the editors for them
		# request for the first step and load it

		# Get the text and the explanation for the first step of that example
		steps = HTMLStep.objects.filter(example=example)
		# get the first non-question step to determine the number of panels
		first_non_question_step = steps.aggregate(Min('step_number'))['step_number__min']
		steps = steps.filter(step_number = first_non_question_step)
		panels = []
		if first_non_question_step != 0: # the first step is a question!
			context_dict['explanation'] = ''
			#context_dict['is_question'] = "true"
			for step in steps:
				panel_number = int(filter(str.isdigit, str(step.panel_id)))
				print panel_number
				panel = {'panel_id' : step.panel_id, 'html' : '', 'panel_number' : panel_number}
				panels.append(panel)

		else:
			explanation = HTMLExplanation.objects.filter(example = example, step_number = first_non_question_step)
			context_dict['explanation'] = explanation[0].html
			#context_dict['is_question'] = "false"
			for step in steps:
				panel_number = int(filter(str.isdigit, str(step.panel_id)))
				print panel_number
				panel = {'panel_id' : step.panel_id, 'html' : step.html, 'panel_number' : panel_number}
				panels.append(panel)
		context_dict['panels'] = panels

	# Change to something more sensible!
	except Example.DoesNotExist:
		return HttpResponseRedirect('/weave/')

	# Go render the response and return it to the client.
	return render_to_response('exerciser/edit_example.html', context_dict, context)


def example_viewer(request):
	"""
	A function to load the main page for the pupil interface
	"""
	# Request the context of the request.
	# The context contains information such as the client's machine details, for example.
	context = RequestContext(request)

	example_list = Example.objects.all()
	
	# Construct a dictionary to pass to the template engine as its context.
	# Note the key boldmessage is the same as {{ boldmessage }} in the template!
	context_dict = {'examples' : example_list}

	for example in example_list:
		example.url = example.name.replace(' ', '_')
	
	# Return a rendered response to send to the client.
	# We make use of the shortcut function to make our lives easier.
	# Note that the first parameter is the template we wish to use.
	return render_to_response('exerciser/example_viewer.html', context_dict, context)




def view_example(request, example_name_url):

	# A function to load the editing page for a selected example. The name of the example is passed as the second parameter of the method.
	
	
	context = RequestContext(request)
	
	## !!!!!!!!!!!!!! check if the author is authenticeted/has the permission to edit this example !!!!!!!!!!!!!!
	##if 'student_registered' in request.session:
		

	# Change underscores in the category name to spaces.
	# URLs don't handle spaces well, so we encode them as underscores.
	# We can then simply replace the underscores with spaces again to get the name.
	example_name = example_name_url.replace('_', ' ')

	# Create a context dictionary which we can pass to the template rendering engine.
	# We start by containing the name of the category passed by the user.
	context_dict = {'example_name': example_name}

	try:

		example = Example.objects.get(name=example_name)
		context_dict['example'] = example
		
		# Get how many panels there are
		# when the request is done- create the panels and the editors for them
		# request for the first step and load it

		# Get the text and the explanation for the first step of that example
		steps = HTMLStep.objects.filter(example=example)
		# get the first non-question step to determine the number of panels
		first_non_question_step = steps.aggregate(Min('step_number'))['step_number__min']
		steps = steps.filter(step_number = first_non_question_step).order_by('panel_id')
		panels = []
		if first_non_question_step != 0: # the first step is a question!
			context_dict['explanation'] = ''
			#context_dict['is_question'] = "true"
			for step in steps:
				panel_number = int(filter(str.isdigit, str(step.panel_id)))
				print panel_number
				panel = {'panel_id' : step.panel_id, 'html' : '', 'panel_number' : panel_number}
				panels.append(panel)

		else:
			explanation = HTMLExplanation.objects.filter(example = example, step_number = first_non_question_step)
			context_dict['explanation'] = explanation[0].html
			#context_dict['is_question'] = "false"
			for step in steps:
				panel_number = int(filter(str.isdigit, str(step.panel_id)))
				print panel_number
				panel = {'panel_id' : step.panel_id, 'html' : step.html, 'panel_number' : panel_number}
				panels.append(panel)
		context_dict['panels'] = panels

	# Change to something more sensible!
	except Example.DoesNotExist:
		print "example doesn't exist"
		return HttpResponseRedirect('/weave/')

	# Go render the response and return it to the client.
	return render_to_response('exerciser/view_example.html', context_dict, context)





def keeptags(value, tags):
    """
    Strips all [X]HTML tags except the space seperated list of tags 
    from the output.
    
    Usage: keeptags:"strong em ul li"
    """
    tags = [re.escape(tag) for tag in tags.split()]
    tags_re = '(%s)' % '|'.join(tags)
    singletag_re = re.compile(r'<(%s\s*/?)>' % tags_re)
    starttag_re = re.compile(r'<(%s)(\s+[^>]+)>' % tags_re)
    endtag_re = re.compile(r'<(/%s)>' % tags_re)
    value = singletag_re.sub('##~~~\g<1>~~~##', value)
    value = starttag_re.sub('##~~~\g<1>\g<3>~~~##', value)
    value = endtag_re.sub('##~~~\g<1>~~~##', value)
    value = strip_tags(value)
    value = escape(value)
    recreate_re = re.compile('##~~~([^~]+)~~~##')
    value = recreate_re.sub('<\g<1>>', value)
    return value

def remove_tags(text):
    return ''.join(ET.fromstring(text).itertext())
"""

def highlight_new_text(raw_old_text, raw_new_text):
	d = Differ()
	plain_old_text = lxml.html.fromstring(raw_old_text).text_content()
	plain_new_text = lxml.html.fromstring(raw_new_text).text_content()
	plain_old_text_list_form = plain_old_text.split()
	plain_new_text_list_form = plain_new_text.split()
	raw_new_text_list_form = raw_new_text.split()

	# compare the plain old and the raw new texts
	comparison_result = list(d.compare(plain_old_text_list_form, raw_new_text_list_form))

	word_index = 0
	in_style_tag = False
	between_style_tag = False
	style_tag = None
	while word_index < len(comparison_result):
		word = comparison_result[word_index] 
		if word[0] == ' ' or word[0] == '+':
			# currently not in style tag so the word is valid unless it is entering a style tag now
			if not in_style_tag:
				if '<span' in word:
					style_tag = "span"
					tag_index = word.index('<span')
				elif '<b' in word:
					style_tag = 'b'
					tag_index = word.index('<b')
				elif '<font' in word:
					style_tag = 'font'
					tag_index = word.index('<font')
				elif '<i' in word:
					style_tag = 'i'
					tag_index = word.index('<i')
				else:
					style_tag = None
				# enters a style tag
				if style_tag != None:
					in_style_tag = True
					ending_symbol_index = getLastOccurrence(word, '>')
					if ending_symbol_index > tag_index:
						# escape the style details and get the appropriate word
						word = word[ending_symbol_index + 1:]
						in_style_tag = False
						between_style_tag = True



	print(result)

"""
def getLastOccurrence(l, element):
	for index, val in enumerate(l):
		lastIndex = -1
		if val==element:
			lastIndex = index

	return lastIndex