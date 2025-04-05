# 使用官方 Node.js 映像作為基礎
FROM node:18

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製前端專案的所有檔案
COPY . .

# 執行開發模式
CMD ["npm", "run", "dev"]