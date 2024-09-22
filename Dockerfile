FROM public.ecr.aws/lambda/python:3.8

# Install system dependencies
RUN yum update -y && \
    yum install -y opencv opencv-devel mesa-libGL

# Copy function code
COPY auto_cropper.py ${LAMBDA_TASK_ROOT}

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Set the CMD to your handler
CMD ["auto_cropper.lambda_handler"]