import os
import xml.etree.ElementTree as ET
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "exercises_system_project.settings")
django.setup()


def populate_examples(applications_filepath, processes_filepath, documents_filepath):
    ordered_documents_fragments_ids, ordered_documents_fragments_texts = populate_documents_order(documents_filepath) # TODO improve

    applications_file = open(applications_filepath, 'r')
    applications = ET.parse(applications_file).getroot()
    for application in applications:
        add_example(application, processes_filepath, ordered_documents_fragments_ids, ordered_documents_fragments_texts)


def add_example(application, processes_filepath, ordered_documents_fragments_ids, ordered_documents_fragments_texts):
    example_name = application.attrib['name']

    # Determine the number of panels - TODO improve
    number_of_panels = 0
    for _ in application.iter('panel'):
        number_of_panels += 1

    # Create the example
    example = Example.objects.get_or_create(name=example_name, number_of_panels=number_of_panels)[0]
    example.save()

    # Read in the steps of the example from the corresponding document
    for panel in application.iter('panel'):
        panel_number = panel.attrib['number']
        document_name = panel.attrib['content']
        print(document_name)
        ordered_document_fragments_ids = ordered_documents_fragments_ids[document_name]
        ordered_document_fragments_texts = ordered_documents_fragments_texts[document_name]
        add_panel_steps(example, panel_number, document_name, ordered_document_fragments_ids, ordered_document_fragments_texts, processes_filepath)


def populate_documents_order(documents_filepath):
    documents_file = open(documents_filepath, 'r')
    documents = ET.parse(documents_file).getroot()

    ordered_documents_fragments_ids = {}
    ordered_documents_fragments_texts = {}

    for document in documents:
        document_name = document.attrib['name']

        ordered_document_fragments_ids = []
        ordered_document_fragments_texts = []

        for text in document:
            next_fragment_id = text.attrib['ID']
            ordered_document_fragments_ids.append(next_fragment_id)

            next_fragment_text = text.attrib['value']
            ordered_document_fragments_texts.append(next_fragment_text)

        ordered_documents_fragments_ids[document_name] = ordered_document_fragments_ids
        ordered_documents_fragments_texts[document_name] = ordered_document_fragments_texts

    return ordered_documents_fragments_ids, ordered_documents_fragments_texts


def order_step_fragments(step_fragment_ids, step_fragment_texts, ordered_document_fragments):
    ordered_step_fragments = []

    for next_possible_fragment in ordered_document_fragments:
        if next_possible_fragment in step_fragment_ids:
            ordered_step_fragments.append(step_fragment_texts[step_fragment_ids.index(next_possible_fragment)])

    return ordered_step_fragments


def add_panel_steps(example, panel_number, document_name, ordered_document_fragment_ids, ordered_document_fragment_texts, processes_filepath):
    processes_file = open(processes_filepath, 'r')
    processes = ET.parse(processes_file).getroot()
    for process in processes:
        # TODO - improve + add missing operations (Delete, Highlight, Unhighlight, Show all, Ask answer)
        if process.attrib['app'] == example.name:
            old_html = ""
            for step in process:
                step_number = int(step.attrib['num']) - 1
                step_fragment_ids = []
                step_fragment_texts = []
                for change in step.iter('change'):
                    # TODO improve
                    for change_element in change:
                        if change_element.tag == "fragname":
                            step_fragment_text = change_element.text
                            step_fragment_id = change_element.attrib['id']
                        elif change_element.tag == "operation":
                            operation = change_element.text
                        elif change_element.tag == "docname":
                            doc_name = change_element.text
                    if doc_name == document_name and operation == "Insert":
                        step_fragment_ids.append(step_fragment_id)
                        step_fragment_texts.append(step_fragment_text)
                    if doc_name == document_name and operation == "Show all":
                        step_fragment_ids = ordered_document_fragment_ids
                        step_fragment_texts = ordered_document_fragment_texts
                    if doc_name == document_name and operation == "Delete":
                        old_html = old_html.replace(step_fragment_text + "\r\n", "")

                # TODO improve
                for step_explanation in step.iter('explanation'):
                    explanation = step_explanation.text

                ordered_step_fragments = order_step_fragments(step_fragment_ids, step_fragment_texts, ordered_document_fragment_ids)

                step_text = ""
                for next_fragment in ordered_step_fragments:
                    step_text += next_fragment + "\r\n"
                step_html = '<span class="style" style="background-color:red; white-space:pre;">' + step_text + '</span>'

                html_step = HTMLStep.objects.get_or_create(example=example, step_number=step_number, html=old_html+step_html,
                                                           panel_id='area' + str(panel_number))[0]
                html_step.save()

                html_explanation = HTMLExplanation.objects.get_or_create(example=example, step_number=step_number, html = explanation)[0]
                html_explanation.save()
                old_html += step_text


if __name__ == '__main__':
    print("Starting DocumentFragment population script...")

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'exercises_system_project.settings')
    from exerciser.models import AcademicYear, Example, HTMLStep, HTMLExplanation

    # If the path to the examples is specified as a command line argument, take it, else assume the examples are placed in the examples folder
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        path = os.path.join(os.path.dirname(__file__), 'examples/')

    applications_path = os.path.join(path, 'Applications.xml')
    processes_path = os.path.join(path, 'Processes.xml')
    documents_filepath = os.path.join(path, 'Documents.xml')

    populate_examples(applications_path, processes_path, documents_filepath)

    # Add an academic year
    academic_year = AcademicYear.objects.get_or_create(start=2019)[0]
