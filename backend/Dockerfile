FROM python:3.13.0

WORKDIR /

COPY requirements.txt /
RUN pip install -r requirements.txt

EXPOSE 8000

CMD python /manage.py runserver
