FROM rsp-eval-agent:2026-10-08
WORKDIR /app
COPY workspace/ /app/
COPY setup.py /opt/task-setup.py
RUN python3 /opt/task-setup.py /app /opt/task-baseline.json
