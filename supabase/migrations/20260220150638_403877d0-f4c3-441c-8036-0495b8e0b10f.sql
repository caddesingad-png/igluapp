-- Allow users to upload their own avatar to avatars/{userId}.jpg
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-photos'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (auth.uid())::text = replace(storage.filename(name), '.jpg', '')
);

-- Allow users to update/replace their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-photos'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (auth.uid())::text = replace(storage.filename(name), '.jpg', '')
);