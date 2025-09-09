# Templates EmailJS pour MyVerif

## Configuration EmailJS

- **Service ID**: `service_rnqc9zh`
- **Template ID**: `template_asgn9e8`
- **Public Key**: `6RR8pBaWS0fFEa_tG`

## Template d'Email - Statut de Soumission

### Variables disponibles dans le template :

- `{{to_email}}` - Email du destinataire
- `{{to_name}}` - Nom du client
- `{{reference_number}}` - Numéro de référence de la soumission
- `{{amount}}` - Montant de la soumission
- `{{submission_type}}` - Type (Coupon ou Carte cadeau)
- `{{status}}` - Statut (Vérifié, Rejeté, Approuvé)
- `{{message}}` - Message personnalisé selon le statut
- `{{subject}}` - Sujet de l'email

### Exemple de template HTML :

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f97316; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .status-verified { color: #10b981; font-weight: bold; }
        .status-rejected { color: #ef4444; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MyVerif - Notification</h1>
        </div>
        
        <div class="content">
            <h2>Bonjour {{to_name}},</h2>
            
            <p>Nous vous informons du statut de votre soumission :</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Référence :</strong> {{reference_number}}</p>
                <p><strong>Type :</strong> {{submission_type}}</p>
                <p><strong>Montant :</strong> {{amount}}€</p>
                <p><strong>Statut :</strong> 
                    <span class="{{#if (eq status 'Vérifié')}}status-verified{{else}}status-rejected{{/if}}">
                        {{status}}
                    </span>
                </p>
            </div>
            
            <p>{{message}}</p>
            
            {{#if (eq status 'Vérifié')}}
            <p>Votre {{submission_type}} a été vérifié avec succès et sera traité selon nos procédures.</p>
            {{/if}}
            
            {{#if (eq status 'Rejeté')}}
            <p>Si vous avez des questions concernant ce rejet, n'hésitez pas à nous contacter.</p>
            {{/if}}
            
            <p>Merci de votre confiance.</p>
            
            <p>Cordialement,<br>L'équipe MyVerif</p>
        </div>
        
        <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p>© 2024 MyVerif - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
```

### Template pour les remboursements approuvés :

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MyVerif - Remboursement Approuvé</h1>
        </div>
        
        <div class="content">
            <h2>Bonjour {{to_name}},</h2>
            
            <p>Excellente nouvelle ! Votre demande de remboursement a été approuvée.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Référence :</strong> {{reference_number}}</p>
                <p><strong>Montant :</strong> {{amount}}€</p>
                <p><strong>Statut :</strong> <span style="color: #10b981; font-weight: bold;">Approuvé</span></p>
            </div>
            
            <p>Le montant de {{amount}}€ sera traité selon votre méthode de remboursement choisie. 
            Vous devriez recevoir votre remboursement dans les 5-7 jours ouvrables.</p>
            
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            
            <p>Merci de votre confiance.</p>
            
            <p>Cordialement,<br>L'équipe MyVerif</p>
        </div>
        
        <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p>© 2024 MyVerif - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
```

## Instructions de configuration

1. Connectez-vous à votre compte EmailJS
2. Allez dans "Email Templates"
3. Créez un nouveau template ou modifiez l'existant
4. Copiez le code HTML ci-dessus
5. Configurez les variables dans la section "Settings"
6. Testez le template avec des données d'exemple

## Résolution de l'erreur 422

L'erreur 422 indique que les paramètres envoyés ne correspondent pas à ceux attendus par le template EmailJS.

### Vérifications à effectuer :

1. **Variables du template** : Assurez-vous que votre template EmailJS utilise exactement ces variables :
   - `{{to_email}}`
   - `{{to_name}}`
   - `{{reference_number}}`
   - `{{amount}}`
   - `{{submission_type}}`
   - `{{status}}`
   - `{{message}}`
   - `{{subject}}`

2. **Configuration du service** :
   - Service ID : `service_rnqc9zh`
   - Template ID : `template_asgn9e8`
   - Public Key : `6RR8pBaWS0fFEa_tG`

3. **Test de configuration** :
   ```javascript
   // Dans la console du navigateur
   EmailService.testEmailConfiguration()
   ```

4. **Vérification des logs** :
   - Ouvrez la console du navigateur
   - Regardez les logs "Paramètres email:" pour vérifier les données envoyées
   - Vérifiez que toutes les variables sont présentes et non vides

## Variables de test

Pour tester le template, utilisez ces valeurs :

```
to_email: test@example.com
to_name: Jean Dupont
reference_number: REF-2024-001
amount: 25.50
submission_type: Coupon
status: Vérifié
message: Félicitations ! Votre coupon a été vérifié avec succès.
subject: Vérification de votre soumission - MyVerif
```
