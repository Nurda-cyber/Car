const Minio = require('minio');
const url = require('url');

const endpoint = process.env.MINIO_ENDPOINT || 'http://minio:9000';
const parsed = url.parse(endpoint);

const minioClient = new Minio.Client({
  endPoint: parsed.hostname || 'minio',
  port: parsed.port ? parseInt(parsed.port, 10) : 9000,
  useSSL: parsed.protocol === 'https:',
  accessKey: process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || 'minioadmin'
});

const bucketName = process.env.MINIO_BUCKET || 'carpro-uploads';

// Обёртки над callback‑API MinIO в промисы
function bucketExistsAsync(name) {
  return new Promise((resolve, reject) => {
    minioClient.bucketExists(name, (err, exists) => {
      if (err) {
        if (err.code === 'NoSuchBucket') {
          return resolve(false);
        }
        return reject(err);
      }
      resolve(exists);
    });
  });
}

function makeBucketAsync(name) {
  return new Promise((resolve, reject) => {
    minioClient.makeBucket(name, '', (err) => {
      if (err) {
        // Если бакет уже есть — не считаем это ошибкой
        if (err.code === 'BucketAlreadyOwnedByYou' || err.code === 'BucketAlreadyExists') {
          return resolve();
        }
        return reject(err);
      }
      resolve();
    });
  });
}

let ensureBucketPromise = null;

async function ensureBucketExists() {
  if (!ensureBucketPromise) {
    ensureBucketPromise = (async () => {
      const exists = await bucketExistsAsync(bucketName);
      if (!exists) {
        await makeBucketAsync(bucketName);
      }
    })();
  }
  return ensureBucketPromise;
}

module.exports = {
  minioClient,
  bucketName,
  ensureBucketExists
};

