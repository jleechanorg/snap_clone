# 🔑 Persistent Google Cloud Authentication Setup

## 🎯 Goal
Set up Google Cloud authentication that **survives computer restarts** and allows `./deploy.sh` to work without re-authentication.

## ✅ What's Already Done
- ✅ Google Cloud SDK installed via Homebrew
- ✅ SDK paths added to your `.bashrc` (lines 137-143)
- ✅ Project set to `worldarchitecture-ai`
- ✅ Currently authenticated as `jleechan@gmail.com`

## 🔧 Missing Piece: Application Default Credentials

You need to set up **Application Default Credentials** once. These persist across reboots.

### **Manual Setup Steps:**

1. **In your terminal, run:**
   ```bash
   gcloud auth application-default login
   ```

2. **Complete browser authentication** (one-time only)

3. **Verify setup:**
   ```bash
   ls -la ~/.config/gcloud/application_default_credentials.json
   ```

4. **Test deployment access:**
   ```bash
   gcloud run services list --platform managed --region us-central1
   ```

## 🚀 After Setup

Once complete, you can:
- Run `./deploy.sh` anytime without authentication prompts
- Restart your computer and deployment still works
- No more `gcloud auth login` needed

## 🔄 How It Works

### **Current Authentication State:**
```bash
# Your bashrc already includes:
export GOOGLE_CLOUD_PROJECT="worldarchitecture-ai"

# Plus these new additions:
if [ -f '/opt/homebrew/share/google-cloud-sdk/path.bash.inc' ]; then 
    source '/opt/homebrew/share/google-cloud-sdk/path.bash.inc'
fi
if [ -f '/opt/homebrew/share/google-cloud-sdk/completion.bash.inc' ]; then 
    source '/opt/homebrew/share/google-cloud-sdk/completion.bash.inc'
fi
```

### **What Application Default Credentials Does:**
- Creates `~/.config/gcloud/application_default_credentials.json`
- This file contains refresh tokens that auto-renew
- Works for all Google Cloud services (Cloud Run, Cloud Build, etc.)
- Persists across terminal sessions and reboots

## 🧪 Test It's Working

After setup, test persistence:

```bash
# This should work without any authentication prompts:
./deploy.sh

# Even after restarting your computer:
# 1. Open new terminal
# 2. cd ~/projects/snap_clone  
# 3. ./deploy.sh  # Should work immediately!
```

## 🔒 Security Notes

- Credentials are stored securely in your user directory
- Only accessible by your user account
- Can be revoked anytime with: `gcloud auth revoke`
- Refresh tokens expire eventually but auto-renew during use

---

**Once you complete the ADC setup, you'll never need to authenticate again for deployments!** 🎉