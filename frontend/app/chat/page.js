"use client";
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Remplace par l'URL de ton backend
const SOCKET_SERVER_URL = "http://localhost:5001";

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [userId] = useState(1); // À remplacer par l'ID de l'utilisateur connecté (depuis ton Auth)
    const socketRef = useRef();
    const scrollRef = useRef();

    // 1. Initialisation de la connexion Socket
    useEffect(() => {
        socketRef.current = io(SOCKET_SERVER_URL, {
            withCredentials: true,
        });

        // Écouter les messages entrants
        socketRef.current.on("receive_message", (data) => {
            setMessages((prev) => [...prev, data]);
        });

        // Charger l'historique depuis la BDD au démarrage
        fetchMessages();

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    // 2. Scroll automatique vers le bas
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${SOCKET_SERVER_URL}/api/messages`);
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error("Erreur historique:", err);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === "") return;

        const messageData = {
            senderId: userId,
            content: input,
            timestamp: new Date(),
        };

        // Envoyer via Socket.io (Temps réel)
        socketRef.current.emit("send_message", messageData);

        // Optionnel : Tu peux aussi faire un POST ici pour sauvegarder 
        // ou laisser le backend s'en charger via l'événement socket.
        
        setInput("");
    };

    return (
        <div className="flex flex-col h-[80vh] max-w-2xl mx-auto border rounded-lg shadow-lg bg-gray-50">
            {/* Header */}
            <div className="p-4 bg-blue-600 text-white rounded-t-lg font-bold">
                Messagerie COS UMMTO - Support en direct
            </div>

            {/* Zone de messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                            msg.senderId === userId 
                            ? 'bg-blue-500 text-white rounded-tr-none' 
                            : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'
                        }`}>
                            <p>{msg.content}</p>
                            <span className="text-[10px] opacity-70 mt-1 block">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Formulaire d'envoi */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
                >
                    Envoyer
                </button>
            </form>
        </div>
    );
}