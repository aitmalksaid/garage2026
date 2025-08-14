# Configuration Supabase pour le Système de Garage

## 1. Configuration des URLs de redirection

Dans votre dashboard Supabase (https://supabase.com/dashboard/project/[PROJECT_ID]/auth/url-configuration) :

### Site URL
\`\`\`
https://your-app-domain.vercel.app
\`\`\`

### Redirect URLs (ajoutez ces URLs) :
\`\`\`
http://localhost:3000/auth/callback
https://your-app-domain.vercel.app/auth/callback
https://v0.app/auth/callback
\`\`\`

## 2. Configuration Email Templates

Dans Authentication > Email Templates :

### Confirm signup template
Changez l'URL de confirmation pour :
\`\`\`
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/
\`\`\`

### Reset password template  
\`\`\`
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password
\`\`\`

## 3. Paramètres d'authentification

Dans Authentication > Settings :

- ✅ Enable email confirmations
- ✅ Enable email change confirmations  
- ✅ Enable secure email change
- ⏱️ JWT expiry: 3600 (1 hour)
- ⏱️ Refresh token rotation: Enabled

## 4. Politiques RLS (Row Level Security)

Exécutez ces requêtes SQL dans l'éditeur SQL :

\`\`\`sql
-- Permettre la lecture des clients pour les utilisateurs authentifiés
CREATE POLICY "Users can view clients" ON clients
FOR SELECT USING (auth.role() = 'authenticated');

-- Permettre l'insertion pour les utilisateurs authentifiés  
CREATE POLICY "Users can insert clients" ON clients
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permettre la mise à jour pour les utilisateurs authentifiés
CREATE POLICY "Users can update clients" ON clients  
FOR UPDATE USING (auth.role() = 'authenticated');

-- Permettre la suppression pour les utilisateurs authentifiés
CREATE POLICY "Users can delete clients" ON clients
FOR DELETE USING (auth.role() = 'authenticated');
\`\`\`

## 5. Test de l'authentification

1. Inscrivez-vous avec un email valide
2. Vérifiez votre boîte email (et spam)
3. Cliquez sur le lien de confirmation
4. Vous devriez être redirigé vers l'application et connecté automatiquement
