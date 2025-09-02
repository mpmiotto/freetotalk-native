# Native Contact Picker Module

This native module implements a contact picker using iOS's `CNContactPickerViewController`, which provides several key advantages over the standard Expo Contacts module:

## Key Benefits

1. **Bypasses Permission Limitations** - The native contact picker works regardless of whether the user previously granted "limited" contacts access. This solves a major UX problem where users who selected limited contacts couldn't easily access other contacts.

2. **Standard iOS Experience** - Uses the familiar iOS contact picker UI that users are comfortable with.

3. **Privacy-Preserving** - iOS only gives the app access to specifically selected contacts, aligning with Apple's privacy model.

4. **No Settings Changes Required** - Users don't need to go to Settings to modify permissions; they can simply use the picker.

## Implementation Details

The module consists of:

1. **Swift Implementation** - `ContactPickerModule.swift` containing the native code that presents the iOS contact picker.

2. **Objective-C Bridge** - `ContactPickerModule.m` providing the React Native bridge declarations.

3. **JavaScript Interface** - `ContactPicker.js` exposing a simple API to call from the app.

## Usage

```javascript
import { pickContact, formatPhoneNumber } from './components/ContactPicker';

// Inside a component or function
const handleSelectContact = async () => {
  try {
    const contact = await pickContact();
    
    if (contact) {
      // contact object contains { name, phoneNumber }
      console.log(`Selected contact: ${contact.name} - ${contact.phoneNumber}`);
      
      // Format phone number if needed
      const formattedNumber = formatPhoneNumber(contact.phoneNumber);
      
      // Do something with the contact...
    } else {
      // User cancelled the selection
      console.log('Contact selection cancelled');
    }
  } catch (error) {
    console.error('Error selecting contact:', error);
    // Handle error...
  }
};
```

## Technical Notes

1. This module requires a development or production build of the Expo app (not Expo Go).

2. The module is integrated through the EAS Build system and the native directories.

3. A fallback to standard contact permission is provided in case the native picker fails.

4. The module is iOS-specific; Android continues to use the standard contacts permission approach.