# Contributing to Virtual Walking Journey Tracker

Thank you for your interest in contributing to this project! This document provides guidelines for contributing.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Code of Conduct

This project adheres to professional standards of conduct. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase account (for cloud sync features)
- Node.js 18+ (for Firebase CLI)
- Git

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd WalkingJourney
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase (Optional):**
   - See [Firebase Cloud Sync](README.md#-firebase-cloud-sync-optional) section in README
   - Update `firebase-sync.js` with your Firebase config

4. **Test locally:**
   - Open `index.html` in a browser
   - Or use a local server:
     ```bash
     npx http-server .
     ```

5. **Run tests:**
   ```bash
   npm test
   npm run lint
   ```

## Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Follow coding standards below
   - Test thoroughly
   - Update documentation

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**

## Coding Standards

### JavaScript

- **Use ES6+ features:** const/let, arrow functions, async/await
- **Never use `var`**
- **Always handle Promise rejections**
- **Use meaningful variable names**
- **Add JSDoc comments** for all functions:
  ```javascript
  /**
   * Calculates distance between two GPS coordinates
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in kilometers
   */
  function calculateDistance(lat1, lon1, lat2, lon2) {
      // implementation
  }
  ```

### HTML/CSS

- **Semantic HTML:** Use appropriate tags (header, nav, main, section, article)
- **Accessibility:** Include ARIA labels, alt text, keyboard navigation
- **Responsive Design:** Mobile-first approach
- **CSS Organization:** Group related styles, use comments

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, no logic change)
- `refactor:` Code refactoring
- `test:` Adding/updating tests
- `chore:` Build process, dependencies

**Examples:**
```
feat: add Google Fit integration
fix: correct distance calculation for curved routes
docs: update README with deployment instructions
```

## Testing

### Manual Testing Checklist

Before submitting:
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices (iOS, Android)
- [ ] Test PWA installation
- [ ] Test offline functionality
- [ ] Test Firebase sync across multiple devices
- [ ] Test with different route configurations
- [ ] Test bulk import feature
- [ ] Verify no console errors

### Future: Automated Testing

We plan to add:
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright/Cypress)
- Coverage target: >80%

## Submitting Changes

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (README, guides)
- [ ] No console.log() statements left in code
- [ ] Tested on multiple browsers
- [ ] CHANGELOG.md updated
- [ ] No breaking changes (or documented if necessary)

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes
```

## Questions?

If you have questions, please:
1. Check existing documentation (README, guides)
2. Search existing issues
3. Create a new issue with the `question` label

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing! 🙏

