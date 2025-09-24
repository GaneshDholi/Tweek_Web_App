const User = require('../models/User'); // Make sure you have the User model
const Calendar = require('../models/Calendar'); // And the Calendar model

router.get("/calendars", async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // 1. Find the user's own personal calendar
        // We'll create one if it doesn't exist for robustness.
        const personalCalendar = await Calendar.findOneAndUpdate(
            { owner: userId, isVirtual: { $ne: true } }, // Find a non-virtual calendar owned by the user
            { 
                $setOnInsert: { 
                    name: "My Calendar",
                    owner: userId,
                    sharedWith: [] 
                } 
            },
            { upsert: true, new: true }
        ).populate('owner', 'firstName lastName _id'); // Populate owner info

        // Add a flag to easily identify it on the frontend
        const personalCalendarObject = personalCalendar.toObject();
        personalCalendarObject.isPersonal = true;


        // 2. Find all virtual calendars that have been shared WITH this user
        const sharedCalendars = await Calendar.find({
            sharedWith: userId, // Find calendars where our user is in the sharedWith array
            isVirtual: true     // And it's a virtual/shared calendar
        }).populate('owner', 'firstName lastName _id'); // Get the owner's info!

        // 3. Combine them into a single list
        const allAccessibleCalendars = [personalCalendarObject, ...sharedCalendars];
        
        res.json(allAccessibleCalendars);

    } catch (err) {
        console.error("Error in GET /calendars:", err);
        res.status(500).json({ error: "Could not fetch calendars." });
    }
});