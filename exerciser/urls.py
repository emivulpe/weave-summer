from django.conf.urls import patterns, url
from exerciser import views

urlpatterns = patterns('',
		url(r'^$', views.index, name='index'),
		url(r'^application/(?P<application_name_url>\w+)/$', views.application, name='application'),
		url(r'^log_info_db', views.log_info_db, name='log_info_db'),
		url(r'^log_question_info_db', views.log_question_info_db, name='log_question_info_db'),
		url(r'^register_group_with_session', views.register_group_with_session, name='register_group_with_session'),
		url(r'^register_teacher_with_session', views.register_teacher_with_session, name='register_teacher_with_session'),
		url(r'^register_student_with_session', views.register_student_with_session, name='register_student_with_session'),
		url(r'^register_year_with_session', views.register_year_with_session, name='register_year_with_session'),
		url(r'^teacher_interface/', views.teacher_interface, name='teacher_interface'),
		url(r'^update_time_graph/$', views.update_time_graph, name='update_time_graph'),
		url(r'^update_class_steps_graph/$', views.update_class_steps_graph, name='update_class_steps_graph'),
		url(r'^get_question_data/$', views.get_question_data, name='get_question_data'),
		url(r'^register/$', views.register, name='register'),
		url(r'^login/$', views.user_login, name='login'),
		url(r'^statistics/', views.statistics, name='statistics'),
		url(r'^create_group/', views.create_group, name='create_group'),
		url(r'^update_group/', views.update_group, name='update_group'),
		url(r'^delete_group/', views.delete_group, name='delete_group'),
		url(r'^logout/$', views.user_logout, name='logout'),
		url(r'^save_session_ids/', views.save_session_ids, name='save_session_ids'),
		url(r'^reset_session', views.reset_session, name='reset_session'),
		url(r'^get_group_list', views.student_group_list, name='student_group_list'),
		url(r'^populate_summary_table', views.populate_summary_table, name='populate_summary_table'),
		url(r'^get_students', views.get_students, name='get_students'),
		url(r'^get_groups/$', views.get_groups, name='get_groups'),
		url(r'^get_largest_step/$', views.get_largest_step, name='get_largest_step'),
		url(r'^get_steps/$', views.get_steps, name='get_steps'),
		url(r'^get_groups_for_year/$', views.get_groups_for_year, name='get_groups_for_year'),
		url(r'^get_application_questions/$', views.get_application_questions, name='get_application_questions'),
		url(r'^del_session_variable/$', views.del_session_variable, name='del_session_variable'),
		url(r'^group_sheet_confirm/$', views.group_sheet_confirm, name='group_sheet_confirm'),
		#url(r'^save_step/$', views.save_step, name='save_step'),
		url(r'^save_step_texts/$', views.save_step_texts, name='save_step_texts'),
		url(r'^save_question/$', views.save_question, name='save_question'),
		url(r'^save_explanation/$', views.save_explanation, name='save_explanation'),
		url(r'^get_next_step/$', views.get_next_step, name='get_next_step'),
		url(r'^author_interface/', views.author_interface, name='author_interface'),
		url(r'^example_creator', views.example_creator, name='example_creator'),
		url(r'^create_example', views.create_example, name='create_example'),
		url(r'^edit_steps', views.edit_steps, name='edit_steps'),
		url(r'^edit_step', views.edit_step, name='edit_step'),
		url(r'^delete_step', views.delete_step, name='delete_step'),
		url(r'^create_step', views.create_step, name='create_step'),

		) 