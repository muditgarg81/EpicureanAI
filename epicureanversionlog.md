# Epicurean AI - Version Build Log

This file tracks all versions, features, improvements, and changes made to the Epicurean AI application.

---

## [2.2.2 - Full Mobile Readiness] - 2026-05-17
### Added
- **Capacitor Deep Link Handler**: Implemented deep link listeners to process Google OAuth redirects on mobile.
- **Material Icons (Classic)**: Switched from Material Symbols to Material Icons for maximum offline/mobile font reliability.

### Fixed
- **Google Login Redirect**: Configured custom scheme (`epicurean.kitchen.app`) in `AndroidManifest.xml` to eliminate blank screens.
- **Responsive Layouts**: Fixed out-of-screen issues on Discovery, Explore, and Pantry pages by enabling full-width containers.
- **Scrolling**: Re-enabled vertical scrolling for long pages like Pricing and Checkout.
- **Logout Flow**: Ensured immediate redirect to the login screen upon signing out.
- **Promo Code**: Fixed the "Apply" button logic for the "BAZINGA" code on both Pricing and Checkout screens.

### Changed
- **Version Increment**: Updated `versionCode` to `17` and `versionName` to `2.2.2`.
- **Clean Build**: Performed a full `./gradlew clean` cycle to ensure a 100% fresh release.

---

## [2.1.2 - Fresh Start] - 2026-05-17
### Added
- **Fresh Source Integration**: Replaced the `src` and `public` directories with the latest designs from Antigravity/Stitch AI.

---

## [1.0] - Initial Launch Features
- **AI Voice Coach**
- **Recipe Genie**
- **Smart Meal Planner**
- **Digital Pantry**

---
*Last Updated: 2026-05-17*
