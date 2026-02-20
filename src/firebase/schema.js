/**
 * Kamgbunli Legacy — Firestore Schema Reference
 * ================================================
 *
 * COLLECTION: memorials
 * ---------------------
 * Each document represents a deceased community member.
 *
 * {
 *   fullName:          string        — Full name of the deceased
 *   dateOfBirth:       string | null — Date of birth (YYYY-MM-DD)
 *   dateOfPassing:     string | null — Date of passing (YYYY-MM-DD)
 *   biography:         string        — Tribute / biography text
 *   imageUrl:          string | null — Primary photo URL (backward compat)
 *   imageUrls:         string[]|null — Array of up to 3 Cloudinary photo URLs
 *   audioTributeUrl:   string | null — Optional Cloudinary URL for a voice tribute
 *   legacyDocumentUrl: string | null — Optional document (PDF, etc.)
 *   postedBy:          string        — UID of the user who submitted this memorial
 *   postedByName:      string        — Display name of the submitter
 *   relationship:      string        — Submitter's relationship to the deceased
 *   familyHouse:       string | null — Family house / address
 *   candlesLit:        number        — Counter for community prayers / remembrances
 *   status:            string        — 'pending' | 'approved' | 'rejected'
 *   isApproved:        boolean       — Quick-check approval flag
 *   createdAt:         timestamp     — Firestore server timestamp
 * }
 *
 *
 * COLLECTION: users
 * -----------------
 * Each document represents a registered community member.
 * Document ID = Firebase Auth UID.
 *
 * {
 *   uid:                string        — Firebase Auth UID
 *   email:              string        — User's email address
 *   displayName:        string        — User's display name
 *   location:           string | null — Location / hometown (optional)
 *   phoneNumber:        string | null — Phone number (optional)
 *   communityReference: string | null — Community reference (optional)
 *   role:               string        — 'member' | 'admin'
 *   isVerified:         boolean       — Whether user is verified
 *   isDisabled:         boolean       — Whether user is disabled
 *   createdAt:          string        — ISO 8601 timestamp
 * }
 *
 *
 * SUB-COLLECTION: chats/{chatId}/messages
 * ----------------------------------------
 * Each document represents a single message in a chat.
 *
 * {
 *   text:               string        — Message text content
 *   senderId:           string        — UID of the sender
 *   senderName:         string        — Display name of the sender
 *   createdAt:          timestamp     — Firestore server timestamp
 *   status:             string        — 'sent' | 'read'
 *   readBy:             string[]      — UIDs of users who have read this message
 *   audioUrl:           string | null — Optional Cloudinary URL for a voice note
 *   imageUrl:           string | null — Optional Cloudinary URL for a chat image
 *   deletedFor:         string[]      — UIDs of users who deleted this message for themselves
 *   deletedForEveryone: boolean       — Whether the message has been deleted for everyone
 * }
 */
