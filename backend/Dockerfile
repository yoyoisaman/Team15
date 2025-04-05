# 使用官方 Python 映像作為基礎
FROM python:3.11

# 設定工作目錄
WORKDIR /app

# 複製 requirements.txt（如果有）或直接安裝依賴
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 複製後端專案的所有檔案
COPY . .

# 執行 Django 伺服器
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]