# Privacy Policy for ClickBook

**Last updated:** May 20, 2026

## Overview

ClickBook is a Chrome extension for saving, organizing, and managing bookmarks. This privacy policy explains how ClickBook handles user data.

## Data Collection

**ClickBook does not collect, transmit, or share any personal data.**

All data — including bookmarks, folder structures, memos, patterns, visit counts, and settings — is stored exclusively in your browser's local storage (`chrome.storage.local`) and never leaves your device.

## External Services

ClickBook does not connect to any external servers. The only external resource used is Google's public favicon service (`https://www.google.com/s2/favicons`) to display website icons. This is a standard image request and does not transmit any personal information.

## AI Features

ClickBook uses Chrome's built-in AI (Gemini Nano via `window.ai`) for bookmark categorization. This AI runs entirely on your device and does not send data to any external server.

## Permissions

| Permission | Purpose |
| --- | --- |
| `activeTab` | Read the URL and title of the current tab when the user clicks the extension icon |
| `storage` | Store bookmarks, folders, settings, and patterns locally |
| `tabs` | Access all open tabs for the bulk import feature |
| `bookmarks` | Import, export, and sync with Chrome's native bookmarks |
| `browsingData` | Provide a user-initiated browsing data cleanup tool |

All permissions are used solely for the stated purposes. No data accessed through these permissions is collected, transmitted, or shared.

## Browsing Data Cleanup

The "Clear Browsing Data" feature operates entirely through Chrome's built-in `browsingData` API. It is only triggered by explicit user action and does not log or store any information about the cleared data.

## Analytics & Tracking

ClickBook does not use any analytics, tracking, telemetry, cookies (beyond Chrome's own extension storage), or third-party services.

## Data Storage

All data is stored locally using `chrome.storage.local` with a 10 MB limit. You can export your data as JSON or HTML at any time from the dashboard. Uninstalling the extension will remove all stored data.

## Changes to This Policy

If this privacy policy is updated, the changes will be reflected in this document with an updated date.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/Junpapapo/ClickBook/issues).
