import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || 'lms-uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'image/png',
    'image/jpeg',
    'text/plain',
];

export async function uploadFile(
    file: File,
    folder = 'submissions'
): Promise<string> {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 10MB limit');
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed`);
    }

    const ext = file.name.split('.').pop() || 'bin';
    const key = `${folder}/${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        })
    );

    return key;
}

export async function getFileUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function deleteFile(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
