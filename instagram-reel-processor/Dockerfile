FROM public.ecr.aws/lambda/python:3.8

# Install system dependencies
RUN yum update -y && \
    yum install -y wget tar xz

# Install FFmpeg
RUN wget https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz && \
    tar xvf ffmpeg-git-amd64-static.tar.xz && \
    mv ffmpeg-git-*-amd64-static/ffmpeg /usr/local/bin/ && \
    rm -rf ffmpeg-git-*-amd64-static*

# Copy requirements file
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install Python dependencies
RUN pip install -r requirements.txt

# Copy function code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD [ "lambda_function.lambda_handler" ]