# Use an AWS-provided base image for Python 3.8 Lambda functions
FROM public.ecr.aws/lambda/python:3.8

# Install system dependencies
RUN yum update -y && \
    yum install -y ffmpeg opencv

# Install Python dependencies in multiple steps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install PyTorch CPU version separately
RUN pip install --no-cache-dir torch==2.2.1+cpu -f https://download.pytorch.org/whl/cpu/torch_stable.html

# Copy function code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD [ "lambda_function.lambda_handler" ]