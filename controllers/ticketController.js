// const client = require("../utils/groq");
const ChatModel = require("../models/chat");
const TicketRise = require("../models/user/TicketRise");
const User = require("../models/user/userModel");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { pushNotification } = require("../utils/notificationService");

// http://localhost:5173/admin/customerSupport/tickets/68a80ab25911f0b9b0ae7c51/chat/fsdfd

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getAIResponse(userMessage) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Add forex-specific system context
    const result = await model.generateContent(
      `You are a professional customer support assistant for a Forex trading app.
       Answer politely, clearly, and only about Forex-related support.
       If the question is not related to Forex or our app, say: 
       "I'm sorry, I can only help with Forex app support."

       User: ${userMessage}`
    );

    return result.response.text();
  } catch (err) {
    console.error("Gemini error:", err);
    return "⚠️ AI service unavailable, please wait for support.";
  }
}

// async function getAIResponse(userMessage) {
//   try {
//     const completion = await client.chat.completions.create({
//       model: "llama-3.1-8b-instant", // free + fast model
//       messages: [
//         { role: "system", content: "You are a helpful support assistant." },
//         { role: "user", content: userMessage },
//       ],
//     });
//     return completion.choices[0].message.content;
//   } catch (err) {
//     console.error("Groq error:", err);
//     return "⚠️ AI service unavailable, a human will reply soon.";
//   }
// }

// ✅ Get tickets by userId (from URL param)
const getUserTickets = async (req, res) => {
  try {
    const { userId } = req.params;

    const tickets = await TicketRise.find({ user: userId })
      .populate("assignedAdmin", "name email")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (err) {
    console.error("Error fetching tickets:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Create new ticket
const createTicket = async (req, res) => {
  try {
    const { userId, subject, description, priority, createdBy } = req.body;

    // 🔹 Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 🔹 Validate subject
    if (!subject) {
      return res
        .status(400)
        .json({ success: false, message: "Subject is required" });
    }

    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: "Description is required" });
    }

    // 🔹 Create ticket
    const newTicket = new TicketRise({
      subject,
      user: userId,
      createdBy,
      status: "in-progress",
      assignedAdmin: "689db373402e7e42af421815", // TODO: dynamic assignment later
      priority: priority || "medium",
      description,
    });

    const savedTicket = await newTicket.save();

    // 🔹 Save first chat (user's description)
    const userChat = new ChatModel({
      ticket: savedTicket._id,
      senderType: "User",
      sender: userId,
      message: description,
    });
    await userChat.save();

    // 🔹 Auto-reply from system/admin
    const autoReply = new ChatModel({
      ticket: savedTicket._id,
      senderType: "System", // or "Admin"
      sender: "689db373402e7e42af421815", // since it's system-generated
      message:
        "✅ Thank you for raising a ticket. Our team will review it shortly! 😊",
    });
    await autoReply.save();

    // 🔹 Populate assignedAdmin (optional)
    const populatedTicket = await TicketRise.findById(savedTicket._id).populate(
      "user",
      "name email"
    )
    .populate("user", "firstName lastName email");

    // pushNotification
    await pushNotification({
      userId: null,
      type: "NEW_TICKET",
      title: "New Ticket Created",
      message: `A new ticket has been created by ${populatedTicket.user.firstName}`,
      entityId: populatedTicket._id,
      entityType: "TicketRise",
      userLink: null,
      adminLink: `/admin/customerSupport/tickets?id=${populatedTicket._id}`,

      // admin/customerSupport/tickets
    });

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket: populatedTicket,
    });
  } catch (err) {
    console.error("Error creating ticket:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// Get single ticket with chats
const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    console.log(ticketId);

    const ticket = await TicketRise.findById(ticketId).populate(
      "user",
      "name email"
    );
    //   .populate("adminUser", "name email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Get all chats for this ticket
    const chats = await ChatModel.find({ ticket: ticketId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...ticket.toObject(),
        chats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching ticket",
      error: error.message,
    });
  }
};

const postMessage = async (req, res) => {
  try {
    const { ticketId, senderType, sender, message } = req.body;
    if (!ticketId || !senderType || !sender || !message)
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });

    const ticket = await TicketRise.findById(ticketId)
    .populate("user", "firstName lastName email");
    if (!ticket)
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });

    const chat = new ChatModel({
      ticket: ticketId,
      senderType,
      sender,
      message,
    });
    await chat.save();

    // 🔹 Emit user message immediately
    const io = req.app.get("io");
    io.to(ticketId).emit("newMessage", chat, ticket.status);

    if (ticket.status === "in-progress") {
      // 🔹 Auto-reply after a short delay
      setTimeout(async () => {
        const autoReply = new ChatModel({
          ticket: ticketId,
          senderType: "Admin",
          sender: "689db373402e7e42af421815",
          message:
            "🤖 Thanks for your message! Our team will get back to you shortly 😊",
        });
        await autoReply.save();
        io.to(ticketId).emit("newMessage", autoReply);
      }, 1000); // 500ms delay (adjust as needed)
    }

    if (ticket.autoReply) {
      const aiReplyText = await getAIResponse(message);

      const autoReply = new ChatModel({
        ticket: ticketId,
        senderType: "Admin",
        sender: "689db373402e7e42af421815",
        message: aiReplyText,
      });
      await autoReply.save();
      io.to(ticketId).emit("newMessage", autoReply, ticket.status);
    } else {
      // pushNotification
      // http://localhost:5173/admin/customerSupport/tickets/68a8454e8da2a82d53c6c459/chat/68a8477f6b3b49b8a90ee978

      await pushNotification({
        userId: null,
        type: "NEW_MESSAGE",
        title: "New Message Received",
        message: `New message from ${ticket.user.firstName}: ${message}`,
        entityId: ticketId,
        entityType: "TicketRise",
        userLink: null,
        adminLink: `/admin/customerSupport/tickets/${ticket._id}/chat/${chat._id}`,

        // admin/customerSupport/tickets
      });
    }
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: chat,
    });
  } catch (error) {
    console.error("Error posting message:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const userFeedBack = async (req, res) => {
  try {
    const { ticketId, feedback } = req.body;

    if (!ticketId || !feedback) {
      return res
        .status(400)
        .json({ success: false, message: "TicketId & feedback required" });
    }

    const ticket = await TicketRise.findByIdAndUpdate(
      ticketId,
      {
        userFeedback: feedback,
        status: feedback === "resolved" ? "resolved" : "closed",
        feedbackAt: new Date(),
      },
      { new: true }
    )
    .populate("user", "firstName lastName email");

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });
    }

    await pushNotification({
      userId: null,
      type: "FEEDBACK_RECEIVED",
      title: "New Feedback Received",
      message: `New feedback from ${ticket.user.firstName}: ${feedback}`,
      entityId: ticketId,
      entityType: "TicketRise",
      userLink: null,
      adminLink: `/admin/customerSupport/tickets?id=${ticket._id}/chat/${123}`,

      // admin/customerSupport/tickets
    });

    res.json({ success: true, message: "Feedback saved", data: ticket });
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ***************************************************************** ADMIN SIDE ***************************************************************

// ✅ Get tickets by userId (from URL param)
const admin_getUserTickets = async (req, res) => {
  const { adminId } = req.params;
  try {
    // Fetch tickets assigned to this admin
    const tickets = await TicketRise.find({ assignedAdmin: adminId })
      .populate("user", "lastName firstName phone email")
      .sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (err) {
    console.error("Error fetching tickets:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Create new ticket
const admin_createTicket = async (req, res) => {
  try {
    const { userId, subject, description, priority, createdBy } = req.body;

    // 🔹 Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 🔹 Validate subject
    if (!subject) {
      return res
        .status(400)
        .json({ success: false, message: "Subject is required" });
    }

    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: "Description is required" });
    }

    // 🔹 Create ticket
    const newTicket = new TicketRise({
      subject,
      user: userId,
      createdBy,
      status: "in-progress",
      assignedAdmin: "689db373402e7e42af421815", // TODO: dynamic assignment later
      priority: priority || "medium",
      description,
    });

    const savedTicket = await newTicket.save();

    // 🔹 Save first chat (user's description)
    const userChat = new ChatModel({
      ticket: savedTicket._id,
      senderType: "User",
      sender: userId,
      message: description,
    });
    await userChat.save();

    // 🔹 Auto-reply from system/admin
    const autoReply = new ChatModel({
      ticket: savedTicket._id,
      senderType: "System", // or "Admin"
      sender: "689db373402e7e42af421815", // since it's system-generated
      message:
        "✅ Thank you for raising a ticket. Our team will review it shortly! 😊",
    });
    await autoReply.save();

    await pushNotification({
      userId: userId,
      type: "TICKET_CREATED",
      title: "New Ticket Created",
      message: `A new ticket has been created: ${subject}`,
      entityId: savedTicket._id,
      entityType: "TicketRise",
      userLink: `/user/ticketDashboard/ticket/${savedTicket._id}`,
      adminLink: `/admin/customerSupport/tickets?id=${savedTicket._id}`,

      // admin/customerSupport/tickets
    });

    // 🔹 Populate assignedAdmin (optional)
    const populatedTicket = await TicketRise.findById(savedTicket._id).populate(
      "user",
      "name email"
    );

    // 🔹 Emit AFTER everything is ready
    const io = req.app.get("io");
    io.to(userId).emit("newTicket", newTicket);

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket: populatedTicket,
    });
  } catch (err) {
    console.error("Error creating ticket:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

const admin_postMessage = async (req, res) => {
  try {
    const { ticketId, senderType, sender, message } = req.body;
    if (!ticketId || !senderType || !sender || !message)
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });

    const ticket = await TicketRise.findById(ticketId);
    if (!ticket)
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });

    const chat = new ChatModel({
      ticket: ticketId,
      senderType: "Admin", // force Admin
      sender,
      message,
    });
    await chat.save();

    if (ticket.status === "in-progress") {
      ticket.status = "open";
      await ticket.save();
    }

    await pushNotification({
      userId: ticket.user,
      type: "NEW_MESSAGE",
      title: "New Message Received",
      message: `New message from Support Team: ${message}`,
      entityId: ticketId,
      entityType: "TicketRise",
      userLink: `/user/ticketDashboard/ticket/${ticketId}/chat/${123}`,
      adminLink: `/admin/customerSupport/tickets?id=${ticketId}/chat/${123}`,

      // admin/customerSupport/tickets
    });

    // 🔹 Emit admin message immediately
    const io = req.app.get("io");
    io.to(ticketId).emit("newMessage", chat, "open");

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: chat,
    });
  } catch (error) {
    console.error("Error posting admin message:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get single ticket with chats
const admin_getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await TicketRise.findById(ticketId)
      .populate("user", "name email")
      .populate("assignedAdmin", "name email");

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });
    }

    const chats = await ChatModel.find({ ticket: ticketId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...ticket.toObject(),
        chats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching ticket",
      error: error.message,
    });
  }
};

// Get single ticket with chats
const admin_EndTheChat = async (req, res) => {
  try {
    const { ticketId, status } = req.body;

    if (!ticketId || !status) {
      return res
        .status(400)
        .json({ success: false, message: "TicketId and status required" });
    }

    // Update ticket
    const ticket = await TicketRise.findByIdAndUpdate(
      ticketId,
      {
        status,
        userFeedback: "pending", // 👈 ask feedback from user after closing
      },
      { new: true }
    );

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });
    }

    // Add system message in chat history
    await ChatModel.create({
      ticket: ticketId,
      senderType: "System",
      sender: "689db373402e7e42af421815",
      message:
        status === "resolved"
          ? "Support ended. Please confirm: Was your issue resolved? ✅ Yes / ❌ No"
          : "Chat ended by Admin. Please confirm if your issue is resolved.",
    });

    await pushNotification({
      userId: ticket.user,
      type: "CHAT_ENDED",
      title: "Chat ended by Admin",
      message: `Chat ended by Admin. Please confirm if your issue is resolved.`,
      entityId: ticketId,
      entityType: "TicketRise",
      userLink: `/user/ticketDashboard/ticket/${ticketId}/chat/${123}`,
      adminLink: `/admin/customerSupport/tickets?id=${ticketId}/chat/${123}`,

      // admin/customerSupport/tickets
    });

    return res.json({
      success: true,
      message: "Ticket updated & feedback requested",
      data: ticket,
    });
  } catch (err) {
    console.error("Error closing ticket:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Toggle auto-reply for a ticket (admin)
const adminToggleAutoReply = async (req, res) => {
  const { ticketId } = req.params;
  const { enabled } = req.body;

  if (typeof enabled !== "boolean") {
    return res.status(400).json({ message: "enabled must be boolean" });
  }

  try {
    // Example using a MongoDB collection named Ticket
    const ticket = await TicketRise.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.autoReply = enabled; // Save auto-reply status
    await ticket.save();

    return res.status(200).json({
      message: "Auto-reply status updated",
      ticketId,
      enabled,
    });
  } catch (err) {
    console.error("Error toggling auto-reply:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Export all controllers
module.exports = {
  postMessage,
  getUserTickets,
  getTicketById,
  createTicket,
  userFeedBack,

  admin_getUserTickets,
  admin_createTicket,
  admin_postMessage,
  admin_getTicketById,
  admin_EndTheChat,
  adminToggleAutoReply,
};
