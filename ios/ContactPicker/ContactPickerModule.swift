import Foundation
import ContactsUI

@objc(ContactPickerModule)
class ContactPickerModule: NSObject, CNContactPickerDelegate {
    
    // Promise callbacks
    private var resolvePromise: RCTPromiseResolveBlock?
    private var rejectPromise: RCTPromiseRejectBlock?
    
    // Prevent multiple pickers from being displayed simultaneously
    private var isPickerDisplayed = false
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        // Must match the Objective-C implementation
        return true
    }
    
    @objc
    func showContactPicker(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        // Guard against multiple simultaneous displays
        if isPickerDisplayed {
            rejecter("busy", "Contact picker is already being displayed", nil)
            return
        }
        
        self.resolvePromise = resolver
        self.rejectPromise = rejecter
        
        // Ensure UI operations happen on the main thread
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                rejecter("deallocated", "Module was deallocated", nil)
                return
            }
            
            // Get the currently presented view controller
            guard let rootVC = RCTPresentedViewController() else {
                rejecter("no_root", "Cannot find a view controller to present from", nil)
                return
            }
            
            self.isPickerDisplayed = true
            
            // Configure the contact picker
            let picker = CNContactPickerViewController()
            picker.delegate = self
            
            // Specifically request phone numbers and name fields
            picker.displayedPropertyKeys = [
                CNContactPhoneNumbersKey,
                CNContactGivenNameKey,
                CNContactFamilyNameKey,
                CNContactOrganizationNameKey,
                CNContactImageDataKey
            ]
            
            // Present the picker
            rootVC.present(picker, animated: true, completion: nil)
        }
    }
    
    func contactPickerDidCancel(_ picker: CNContactPickerViewController) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            // Reset flag
            self.isPickerDisplayed = false
            
            // Resolve with null to indicate cancellation
            if let resolver = self.resolvePromise {
                resolver(nil)
            }
            
            // Clear references
            self.cleanupPromises()
        }
    }
    
    func contactPicker(_ picker: CNContactPickerViewController, didSelect contact: CNContact) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            // Reset flag
            self.isPickerDisplayed = false
            
            if let resolver = self.resolvePromise {
                // Extract contact information
                let contactInfo = self.extractContactInfo(from: contact)
                resolver(contactInfo)
            }
            
            // Clear references
            self.cleanupPromises()
        }
    }
    
    // Helper method to extract contact information
    private func extractContactInfo(from contact: CNContact) -> [String: Any] {
        // Phone number extraction (prioritize mobile)
        var phoneNumber: String = ""
        
        // First try to get mobile number
        if let mobilePhone = contact.phoneNumbers.first(where: { 
            $0.label == CNLabelPhoneNumberMobile || 
            $0.label == CNLabelPhoneNumberiPhone || 
            ($0.label?.contains("mobile") ?? false)
        })?.value.stringValue {
            phoneNumber = mobilePhone
        } 
        // Then try work number
        else if let workPhone = contact.phoneNumbers.first(where: {
            $0.label == CNLabelWork || 
            ($0.label?.contains("work") ?? false)
        })?.value.stringValue {
            phoneNumber = workPhone
        }
        // Then try home number
        else if let homePhone = contact.phoneNumbers.first(where: {
            $0.label == CNLabelHome || 
            ($0.label?.contains("home") ?? false)
        })?.value.stringValue {
            phoneNumber = homePhone
        }
        // Fallback to first available number
        else if let firstPhone = contact.phoneNumbers.first?.value.stringValue {
            phoneNumber = firstPhone
        }
        
        // Name extraction
        var name: String = ""
        
        // First and last name
        if !contact.givenName.isEmpty {
            name = contact.givenName
            if !contact.familyName.isEmpty {
                name += " " + contact.familyName
            }
        } 
        // Just last name
        else if !contact.familyName.isEmpty {
            name = contact.familyName
        } 
        // Organization name as fallback
        else if !contact.organizationName.isEmpty {
            name = contact.organizationName
        }
        // Absolute fallback
        else {
            name = "Contact"
        }
        
        // Clean the phone number - remove any non-numeric characters except +
        phoneNumber = phoneNumber.replacingOccurrences(of: "[^0-9+]", with: "", options: .regularExpression)
        
        // Extract thumbnail image if available
        var thumbnail: String? = nil
        if let imageData = contact.thumbnailImageData {
            thumbnail = imageData.base64EncodedString()
        }
        
        // Create the result dictionary
        var contactInfo: [String: Any] = [
            "name": name,
            "phoneNumber": phoneNumber
        ]
        
        // Only include thumbnail if available
        if let thumbnail = thumbnail {
            contactInfo["thumbnailBase64"] = thumbnail
        }
        
        return contactInfo
    }
    
    // Helper to clean up promises and avoid retain cycles
    private func cleanupPromises() {
        self.resolvePromise = nil
        self.rejectPromise = nil
    }
}