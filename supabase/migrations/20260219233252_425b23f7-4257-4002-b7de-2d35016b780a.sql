
-- Allow authenticated users to upload set cover photos into the product-photos bucket under sets/ path
CREATE POLICY "Users can upload set photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-photos'
    AND auth.uid()::text = (storage.foldername(name))[2]
    AND (storage.foldername(name))[1] = 'sets'
  );

CREATE POLICY "Users can update set photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-photos'
    AND auth.uid()::text = (storage.foldername(name))[2]
    AND (storage.foldername(name))[1] = 'sets'
  );
