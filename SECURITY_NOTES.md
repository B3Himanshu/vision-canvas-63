# Security Notes

## Important Security Practices

### Environment Variables
- ✅ **Never commit `.env.local` to git** - It's already in `.gitignore`
- ✅ **Never commit passwords or credentials** to the repository
- ✅ All sensitive configuration should be in `.env.local` only
- ✅ Use `env.example` as a template (without real credentials)

### Database Credentials
- Database host, username, and password should **only** be in `.env.local`
- Documentation files use placeholders (`your_database_host`, `your_database_password`)
- Scripts read from environment variables, not hardcoded values

### Files to Never Commit
- `.env.local` - Contains actual credentials
- `.env` - Any environment file
- `*credentials*` - Any file with credentials
- `*secrets*` - Any file with secrets
- `*password*` - Any file with passwords

### Before Committing
1. Check `.gitignore` is up to date
2. Verify no `.env.local` files are tracked
3. Ensure no hardcoded passwords in code
4. Review all documentation for placeholder values only

### If Credentials Are Exposed
1. **Immediately rotate** all exposed passwords
2. **Remove** credentials from git history (if already committed)
3. **Update** `.gitignore` to prevent future commits
4. **Review** all files for any remaining credentials
