-- Créer le bucket pour les images temporaires
INSERT INTO storage.buckets (id, name, public)
VALUES ('fiches-temp', 'fiches-temp', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre l'upload (anonyme)
CREATE POLICY "Allow anonymous uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'fiches-temp');

-- Politique pour permettre la lecture (anonyme)
CREATE POLICY "Allow anonymous reads"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'fiches-temp');

-- Politique pour permettre la suppression (anonyme)
CREATE POLICY "Allow anonymous deletes"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'fiches-temp');
