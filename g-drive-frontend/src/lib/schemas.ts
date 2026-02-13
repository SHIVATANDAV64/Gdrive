 

import { z } from 'zod';





 
export const FileDocumentSchema = z.object({
    $id: z.string(),
    $createdAt: z.string(),
    $updatedAt: z.string(),
    name: z.string().min(1).max(255),
    mimeType: z.string(),
    sizeBytes: z.number().nonnegative(),
    storageKey: z.string(),
    ownerId: z.string(),
    folderId: z.string().nullable(),
    versionId: z.string().nullable(),
    checksum: z.string().nullable(),
    isDeleted: z.boolean(),
});

export type ValidatedFileDocument = z.infer<typeof FileDocumentSchema>;

 
export const FileListResponseSchema = z.object({
    documents: z.array(FileDocumentSchema),
    total: z.number(),
});





 
export const FolderSchema = z.object({
    $id: z.string(),
    $createdAt: z.string(),
    $updatedAt: z.string(),
    name: z.string().min(1).max(255),
    ownerId: z.string(),
    parentId: z.string().nullable(),
    isDeleted: z.boolean(),
});

export type ValidatedFolder = z.infer<typeof FolderSchema>;

 
export const FolderListResponseSchema = z.object({
    documents: z.array(FolderSchema),
    total: z.number(),
});





 
export const FileUploadInputSchema = z.object({
    name: z.string().min(1).max(255),
    folderId: z.string().nullable().optional(),
});

 
export const FolderCreateInputSchema = z.object({
    name: z.string()
        .min(1, 'Folder name is required')
        .max(255, 'Folder name too long')
        .refine(
            
            (name) => !/[/\\<>:"|?*\x00-\x1f]/.test(name),
            'Folder name contains invalid characters'
        ),
    parentId: z.string().nullable().optional(),
});

 
export const RenameInputSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(255, 'Name too long')
        .refine(
            
            (name) => !/[/\\<>:"|?*\x00-\x1f]/.test(name),
            'Name contains invalid characters'
        ),
});

 
export const SignupSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
    email: z.string()
        .email('Please enter a valid email'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Za-z]/, 'Password must contain at least one letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});





 
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        error: z.object({
            code: z.string(),
            message: z.string(),
        }).optional(),
    });

 
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
    const result = schema.safeParse(data);
    if (result.success) {
        return result.data;
    }
    console.error('Validation failed:', result.error.issues);
    return null;
}





export const schemas = {
    FileDocument: FileDocumentSchema,
    FileListResponse: FileListResponseSchema,
    Folder: FolderSchema,
    FolderListResponse: FolderListResponseSchema,
    FileUploadInput: FileUploadInputSchema,
    FolderCreateInput: FolderCreateInputSchema,
    RenameInput: RenameInputSchema,
    Signup: SignupSchema,
};

export default schemas;
