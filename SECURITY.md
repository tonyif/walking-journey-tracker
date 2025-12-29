# Security Policy

## 🔒 Security Overview

This document outlines the security considerations, policies, and procedures for the Virtual Walking Journey Tracker application.

## 🛡️ Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## 📦 Software Bill of Materials (SBOM)

### Core Dependencies

| Component | Version | Purpose | License |
|-----------|---------|---------|---------|
| Leaflet | 1.9.4 | Interactive maps | BSD-2-Clause |
| Leaflet Routing Machine | 3.2.12 | Route visualization | MIT |
| Font Awesome | 6.4.0 | Icons | MIT |
| Firebase SDK | 10.7.1 | Authentication & Database | Apache-2.0 |

### External APIs

| Service | Purpose | Data Shared | Privacy Policy |
|---------|---------|-------------|----------------|
| Nominatim (OpenStreetMap) | Geocoding | Location names | [OSM Policy](https://wiki.osmfoundation.org/wiki/Privacy_Policy) |
| OSRM | Route calculation | GPS coordinates | Open source, self-hostable |
| Overpass API | Points of interest | GPS coordinates | OpenStreetMap data |
| Firebase Firestore | Data storage | User walks, routes | [Firebase Privacy](https://firebase.google.com/support/privacy) |
| Firebase Auth | User authentication | Google account (SSO) | [Firebase Privacy](https://firebase.google.com/support/privacy) |

## 🚨 Reporting a Vulnerability

### Reporting Process

If you discover a security vulnerability, please follow these steps:

1. **DO NOT** open a public issue
2. Email security concerns to: **tony.issac@gmail.com**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: Next release

## 🎯 Severity Classification (CVSS v3.1)

| Severity | CVSS Score | Examples |
|----------|------------|----------|
| Critical | 9.0-10.0 | Authentication bypass, data breach |
| High | 7.0-8.9 | SQL injection, XSS, unauthorized access |
| Medium | 4.0-6.9 | CSRF, information disclosure |
| Low | 0.1-3.9 | Minor information leaks |

## 🔐 Security Best Practices

### For Users

1. **Authentication:**
   - Use Google Sign-In (SSO) for secure authentication
   - Never share your login credentials
   - Sign out on shared devices

2. **Data Privacy:**
   - Your walk data is private and isolated per user
   - Only you can access your walking history
   - No data is shared with other users

3. **Device Security:**
   - Keep your devices updated
   - Use strong device passwords/PINs
   - Enable two-factor authentication on your Google account

4. **Public Devices:**
   - Use incognito/private browsing mode
   - Always sign out after use
   - Clear browser cache

### For Developers

1. **Firebase Security:**
   - Never commit Firebase config with production keys
   - Use environment variables for sensitive data
   - Review Firestore security rules regularly
   - Enable Firebase App Check for production

2. **API Keys:**
   - Store API keys securely
   - Use Firebase Functions for server-side API calls if needed
   - Implement rate limiting

3. **Input Validation:**
   - Validate all user inputs (distance, location names)
   - Sanitize data before database writes
   - Prevent XSS attacks

4. **HTTPS Only:**
   - Firebase Hosting enforces HTTPS
   - Never allow HTTP connections
   - Verify SSL certificates

## 🛠️ Known Security Considerations

### 1. **Public APIs (Nominatim, OSRM, Overpass)**
- **Risk:** Rate limiting, service availability
- **Mitigation:** 
  - Implement client-side caching
  - Consider self-hosting for production
  - Respect API usage policies

### 2. **Client-Side Data Storage**
- **Risk:** Data visible in browser localStorage (if offline mode)
- **Mitigation:**
  - Data now stored in Firebase (encrypted at rest)
  - LocalStorage only for temporary caching
  - Sensitive data not stored locally

### 3. **User Data Isolation**
- **Protection:** Firestore security rules
- **Rule:** Users can only read/write their own data
  ```javascript
  match /users/{userId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
  ```

### 4. **Third-Party Dependencies**
- **Risk:** Vulnerabilities in libraries (Leaflet, Firebase SDK)
- **Mitigation:**
  - Use CDN versions with SRI (Subresource Integrity)
  - Regular dependency updates
  - Monitor security advisories

## 🔍 Security Testing

### Current Status
- [x] Firebase Authentication implemented
- [x] Firestore security rules configured
- [x] HTTPS deployment (Firebase Hosting)
- [x] User data isolation verified
- [ ] Automated security scanning (planned)
- [ ] Penetration testing (planned)
- [ ] Dependency vulnerability scanning (planned)

### Planned Improvements
1. **npm audit** integration for dependency scanning
2. **OWASP ZAP** or similar for vulnerability scanning
3. **Content Security Policy (CSP)** headers
4. **Firebase App Check** for API abuse prevention
5. **Rate limiting** for API calls

## 📢 Security Advisories

### Current Advisories
None at this time.

### Past Advisories
None at this time.

## 🏆 Security Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

- (No vulnerabilities reported yet)

## 📋 Compliance

### Data Privacy
- **GDPR:** User has control over their data (can delete account/data)
- **Data Retention:** Data stored until user deletion
- **Data Export:** Users can export their walk data
- **Right to be Forgotten:** Users can delete their account and all associated data

### Encryption
- **In Transit:** HTTPS/TLS 1.3
- **At Rest:** Firebase Firestore encryption
- **Authentication:** OAuth 2.0 (Google Sign-In)

## 🔗 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [Web Security Basics](https://developer.mozilla.org/en-US/docs/Web/Security)

## 📅 Last Updated

December 29, 2024

---

**Version**: 1.0.0  
**Created By**: Development Team  
**Contact**: your-email@domain.com (update this)

