const Minio = require('minio');
require('dotenv').config();

// Client dùng để kết nối và thao tác với bucket (từ container gọi sang container)
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    region: 'us-east-1'
});

// Client thứ 2 chỉ dùng để tạo Presigned URL với HTTP Host là localhost (để Postman/Client gọi được từ ngoài vào)
// Cần có region để không query bucket location qua mạng => không bị ECONNREFUSED
const minioExternalClient = new Minio.Client({
    endPoint: 'localhost',
    port: parseInt(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    region: 'us-east-1'
});

module.exports = { minioClient, minioExternalClient };