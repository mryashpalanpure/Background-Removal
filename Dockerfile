FROM public.ecr.aws/lambda/python:3.12

ENV NUMBA_CACHE_DIR=/tmp/numba_cache

ENV NUMBA_DISABLE_JIT=1

ENV REMBG_HOME=${LAMBDA_TASK_ROOT}/.rembg

COPY requirements.txt ${LAMBDA_TASK_ROOT}

RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "import os, urllib.request; p=os.path.join(os.environ['REMBG_HOME'],'models','u2netp','u2netp.onnx'); os.makedirs(os.path.dirname(p), exist_ok=True); urllib.request.urlretrieve('https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx', p)"

COPY lambda_function.py ${LAMBDA_TASK_ROOT}

CMD [ "lambda_function.lambda_handler" ]