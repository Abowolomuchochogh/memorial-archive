const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Trigger: When a user document is updated.
 * Action: If isVerified changes from false to true, send a welcome email.
 */
exports.onUserVerified = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();

        // Check if verification status changed to true
        if (newData.isVerified === true && oldData.isVerified === false) {
            const userEmail = newData.email;
            const userName = newData.displayName || "Member";

            console.log(`User ${context.params.userId} verified. Sending welcome email to ${userEmail}.`);

            // Construct Email HTML
            const emailHtml = `
            <div style="font-family: 'Georgia', serif; color: #1c3d2f; max-width: 600px; margin: 0 auto; background-color: #fdfbf7; padding: 40px; border: 1px solid #eaddcf; border-radius: 12px;">
                
                <!-- Header / Logo -->
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3c5e4b; padding-bottom: 20px;">
                    <h1 style="color: #3c5e4b; font-size: 28px; margin: 0;">Kamgbunli Legacy</h1>
                    <p style="color: #6b8c7a; font-size: 14px; margin-top: 5px;">Honoring Our Loved Ones</p>
                </div>

                <!-- Bismillah -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <p style="font-size: 20px; color: #d4a373; margin-bottom: 5px;" dir="rtl">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                    <p style="font-size: 12px; color: #8a7a6a; font-style: italic;">Bismillah-ir-Rahman-ir-Rahim</p>
                </div>

                <!-- Greeting -->
                <p style="font-size: 16px; line-height: 1.6;">
                    <strong>Assalamu Alaikum ${userName},</strong>
                </p>

                <p style="font-size: 16px; line-height: 1.6;">
                    Your account for <strong>Kamgbunli Legacy</strong> has been verified by the Admin. You are now a recognized member of our digital archive.
                </p>

                <!-- Features List -->
                <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eaddcf; margin: 25px 0;">
                    <p style="margin-top: 0; font-weight: bold; color: #3c5e4b;">You can now:</p>
                    <ul style="padding-left: 20px; margin-bottom: 0;">
                        <li style="margin-bottom: 10px;">Create memorial posts for your loved ones.</li>
                        <li style="margin-bottom: 10px;">Send private condolences to other families.</li>
                        <li>Browse the Family House archives.</li>
                    </ul>
                </div>

                <p style="font-size: 16px; line-height: 1.6;">
                    Thank you for helping us preserve our community's history.
                </p>

                <!-- Signoff -->
                <div style="margin-top: 40px; border-top: 1px solid #eaddcf; padding-top: 20px;">
                    <p style="font-size: 16px; line-height: 1.6; margin: 0;">
                        Fi Amanillah,
                    </p>
                    <p style="font-size: 16px; font-weight: bold; color: #3c5e4b; margin: 5px 0 0 0;">
                        Sulleyman Zulkanain (Abowolo)
                    </p>
                    <p style="font-size: 14px; color: #6b8c7a; margin: 0;">Lead Developer, Kamgbunli Legacy</p>
                </div>

            </div>
            `;

            // Prepare email document for Extension
            const mailOptions = {
                to: userEmail,
                message: {
                    subject: "Your Account is Verified - Welcome to Kamgbunli Legacy",
                    html: emailHtml,
                },
            };

            // Write to 'mail' collection
            try {
                await db.collection("mail").add(mailOptions);
                console.log("Email queued in 'mail' collection.");
            } catch (error) {
                console.error("Error writing to mail collection:", error);
            }
        }
    });

/**
 * Trigger: When a new message is created in a chat.
 * Action: Send an email notification to the recipient (the other participant).
 */
exports.onMessageCreated = functions.firestore
    .document("chats/{chatId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
        const messageData = snap.data();
        const chatId = context.params.chatId;
        const senderId = messageData.senderId;

        if (!senderId) {
            console.log("No senderId in message, skipping email.");
            return;
        }

        try {
            // 1. Get the Chat document to find participants
            const chatSnap = await db.collection("chats").doc(chatId).get();
            if (!chatSnap.exists) {
                console.log(`Chat ${chatId} not found.`);
                return;
            }
            const chatData = chatSnap.data();

            // 2. Identify Recipient (stored as array of UIDs)
            const participants = chatData.participants || [];
            const recipientId = participants.find((uid) => uid !== senderId);

            if (!recipientId) {
                console.log("No recipient found (chat might be empty or self-chat).");
                return;
            }

            // 3. Get Recipient's Email from their User Profile
            const recipientSnap = await db.collection("users").doc(recipientId).get();
            if (!recipientSnap.exists) {
                console.log(`Recipient user ${recipientId} not found.`);
                return;
            }
            const recipientData = recipientSnap.data();
            const recipientEmail = recipientData.email;
            const recipientName = recipientData.displayName || "Family Member";

            // Sender name for the email
            const senderName = messageData.senderName || "A Community Member";

            if (!recipientEmail) {
                console.log(`Recipient ${recipientId} has no email address.`);
                return;
            }

            console.log(`Sending new message email to ${recipientEmail} from ${senderName}`);

            // 4. Construct Email HTML
            const emailHtml = `
            <div style="font-family: 'Georgia', serif; color: #1c3d2f; max-width: 600px; margin: 0 auto; background-color: #fdfbf7; padding: 40px; border: 1px solid #eaddcf; border-radius: 12px;">
                
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3c5e4b; padding-bottom: 20px;">
                    <h1 style="color: #3c5e4b; font-size: 24px; margin: 0;">Kamgbunli Legacy</h1>
                    <p style="color: #6b8c7a; font-size: 14px; margin-top: 5px;">New Message Notification</p>
                </div>

                <p style="font-size: 16px; line-height: 1.6;">
                    <strong>Assalamu Alaikum ${recipientName},</strong>
                </p>

                <p style="font-size: 16px; line-height: 1.6;">
                    You have received a new private message from <strong>${senderName}</strong> regarding a memorial.
                </p>

                <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eaddcf; margin: 25px 0;">
                    <p style="font-style: italic; color: #555; margin: 0;">"${messageData.text}"</p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://wolo-5fbcd.web.app/chat/${chatId}" 
                       style="background-color: #3c5e4b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: sans-serif;">
                       Reply to Message
                    </a>
                </div>

                <div style="margin-top: 40px; border-top: 1px solid #eaddcf; padding-top: 20px; font-size: 12px; color: #8a7a6a; text-align: center;">
                    <p>Sent via Kamgbunli Legacy</p>
                </div>

            </div>
            `;

            // 5. Write to 'mail' collection to trigger Extension
            await db.collection("mail").add({
                to: recipientEmail,
                message: {
                    subject: `New Message from ${senderName} - Kamgbunli Legacy`,
                    html: emailHtml,
                },
            });

        } catch (error) {
            console.error("Error sending message notification:", error);
        }
    });

/**
 * Trigger: When a new memorial is created.
 * Action: Send "Submission Received" email to the user.
 */
exports.onMemorialCreated = functions.firestore
    .document("memorials/{memorialId}")
    .onCreate(async (snap, context) => {
        const memorialData = snap.data();
        const userId = memorialData.postedBy;

        if (!userId) {
            console.log("No postedBy userId, skipping email.");
            return;
        }

        try {
            // Get User Email
            const userSnap = await db.collection("users").doc(userId).get();
            if (!userSnap.exists) {
                console.log(`User ${userId} not found.`);
                return;
            }
            const userData = userSnap.data();
            const userEmail = userData.email;
            const userName = userData.displayName || "Member";

            if (!userEmail) return;

            // Only send if it's PENDING (Admins auto-approve, so they don't need "pending" email)
            if (memorialData.status === 'pending') {
                console.log(`Sending memorial receipt to ${userEmail}`);

                const emailHtml = `
                <div style="font-family: 'Georgia', serif; color: #1c3d2f; max-width: 600px; margin: 0 auto; background-color: #fdfbf7; padding: 40px; border: 1px solid #eaddcf; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3c5e4b; padding-bottom: 20px;">
                        <h1 style="color: #3c5e4b; font-size: 24px; margin: 0;">Kamgbunli Legacy</h1>
                        <p style="color: #6b8c7a; font-size: 14px; margin-top: 5px;">Submission Received</p>
                    </div>
                    <p><strong>Assalamu Alaikum ${userName},</strong></p>
                    <p>We have received your memorial submission for <strong>${memorialData.fullName}</strong>.</p>
                    <p>It is currently <strong>Pending Approval</strong>. Our team will review it shortly to ensure it meets our community guidelines.</p>
                    <p>You will receive another email once it is approved and live on the Tribute Wall.</p>
                    <div style="margin-top: 40px; border-top: 1px solid #eaddcf; padding-top: 20px; font-size: 12px; color: #8a7a6a; text-align: center;">
                        <p>JazakAllah Khair for your patience.</p>
                    </div>
                </div>
                `;

                await db.collection("mail").add({
                    to: userEmail,
                    message: {
                        subject: `Submission Received: ${memorialData.fullName} - Kamgbunli Legacy`,
                        html: emailHtml,
                    },
                });
            }
        } catch (error) {
            console.error("Error sending memorial created notification:", error);
        }
    });

/**
 * Trigger: When a memorial is updated (Approved).
 * Action: Send "Memorial Live" email.
 */
exports.onMemorialUpdated = functions.firestore
    .document("memorials/{memorialId}")
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();

        // Check if just approved
        if (oldData.isApproved !== true && newData.isApproved === true) {
            const userId = newData.postedBy;
            if (!userId) return;

            try {
                // Get User Email
                const userSnap = await db.collection("users").doc(userId).get();
                if (!userSnap.exists) return;

                const userData = userSnap.data();
                const userEmail = userData.email;
                const userName = userData.displayName || "Member";

                if (!userEmail) return;

                console.log(`Sending approval email to ${userEmail}`);

                const emailHtml = `
                <div style="font-family: 'Georgia', serif; color: #1c3d2f; max-width: 600px; margin: 0 auto; background-color: #fdfbf7; padding: 40px; border: 1px solid #eaddcf; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3c5e4b; padding-bottom: 20px;">
                        <h1 style="color: #3c5e4b; font-size: 24px; margin: 0;">Kamgbunli Legacy</h1>
                        <p style="color: #6b8c7a; font-size: 14px; margin-top: 5px;">Memorial Approved</p>
                    </div>
                    <p><strong>Assalamu Alaikum ${userName},</strong></p>
                    <p>Great news! The memorial for <strong>${newData.fullName}</strong> has been approved and is now live on the Tribute Wall.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://wolo-5fbcd.web.app/memorial/${context.params.memorialId}" 
                           style="background-color: #3c5e4b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: sans-serif;">
                           View Memorial
                        </a>
                    </div>

                    <p style="margin-top: 25px; font-size: 14px;">Friends and family can now visit, light candles, and leave messages.</p>
                </div>
                `;

                await db.collection("mail").add({
                    to: userEmail,
                    message: {
                        subject: `Live Now: ${newData.fullName} - Kamgbunli Legacy`,
                        html: emailHtml,
                    },
                });

            } catch (error) {
                console.error("Error sending memorial approval notification:", error);
            }
        }
    });
