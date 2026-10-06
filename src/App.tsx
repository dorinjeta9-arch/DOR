/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  Boxes,
  Cpu,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock,
  Upload,
  FileText,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  X,
  Send,
  Settings,
  User,
  Building2,
  Hammer,
  Eye,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertCircle,
  Check,
  Menu,
  Globe,
  Calendar,
  CheckSquare,
  Presentation,
  Video
} from "lucide-react";
import * as THREE from "three";
import { initAuth, googleSignIn, getAccessToken, logout } from "./firebase";
import { createCalendarEvent, createGoogleTask, createGoogleSlideDeck, createGoogleMeetSpace } from "./workspace";
import { User as FirebaseUser } from "firebase/auth";

interface QuoteItem {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  company?: string;
  technology: "FDM" | "SLA";
  material: string;
  finish: string;
  units: number;
  urgency: "normal" | "urgent";
  fileName: string;
  fileSize: number;
  volumeCm3: number;
  estimatedHours: number;
  estimatedPrice: number;
  status: "Recibida" | "En revisión" | "Presupuesto enviado" | "En fabricación" | "Finalizado";
  createdAt: string;
  adminNotes?: string;
}

type Language = "es" | "en" | "fr";

const translations = {
  es: {
    brand: "PROJET 3D",
    home: "Inicio",
    services: "Servicios",
    quote: "Cotizador STL",
    process: "Proceso",
    about: "Quiénes Somos",
    contact: "Contacto",
    admin: "Admin",
    reqQuote: "Solicitar Presupuesto",
    heroTitle: "Tú aportas la idea o el diseño. Nosotros nos encargamos de",
    heroHighlight: "convertirlo en realidad.",
    heroSubtitle: "Soluciones avanzadas en impresión 3D FDM y SLA, series cortas y optimización CAD (DfAM) desde nuestro taller en el Polígono Industrial La Atalaya.",
    uploadStl: "Enviar Archivo STL",
    viewServices: "Ver Tecnologías y Materiales",
    expressHours: "Plazo exprés 24/48h",
    precisionTech: "FDM & SLA Industrial",
    hybridClients: "Atención B2B y B2C",
    step1: "1. Datos Cliente",
    step2: "2. Archivo STL & Visor",
    step3: "3. Especificaciones",
    step4: "4. Resumen & Envío",
    next: "Siguiente Paso",
    prev: "Anterior",
    submit: "Enviar Solicitud de Presupuesto",
    notice: "El importe mostrado es una estimación orientativa. Un técnico de PROJET 3D revisará la geometría de su archivo .STL y le enviará el presupuesto definitivo aprobado en un plazo máximo de 24 horas."
  },
  en: {
    brand: "PROJET 3D",
    home: "Home",
    services: "Services",
    quote: "STL Quote",
    process: "Process",
    about: "About Us",
    contact: "Contact",
    admin: "Admin",
    reqQuote: "Request Quote",
    heroTitle: "You provide the idea or design. We take care of turning it into",
    heroHighlight: "reality.",
    heroSubtitle: "Advanced 3D printing FDM and SLA solutions, short series and CAD optimization (DfAM) from our workshop in La Atalaya Industrial Estate.",
    uploadStl: "Upload STL File",
    viewServices: "View Technologies & Materials",
    expressHours: "24/48h Express",
    precisionTech: "Industrial FDM & SLA",
    hybridClients: "B2B & B2C Support",
    step1: "1. Client Data",
    step2: "2. STL & 3D Viewer",
    step3: "3. Specifications",
    step4: "4. Summary & Submit",
    next: "Next Step",
    prev: "Previous",
    submit: "Submit Quote Request",
    notice: "The displayed amount is an orientative estimate. A PROJET 3D technician will review your .STL file geometry and send you the final approved quote within a maximum of 24 hours."
  },
  fr: {
    brand: "PROJET 3D",
    home: "Accueil",
    services: "Services",
    quote: "Devis STL",
    process: "Processus",
    about: "À Propos",
    contact: "Contact",
    admin: "Admin",
    reqQuote: "Demander un Devis",
    heroTitle: "Vous fournissez l'idée ou le design. Nous nous chargeons de le transformer en",
    heroHighlight: "réalité.",
    heroSubtitle: "Solutions avancées d'impression 3D FDM et SLA, petites séries et optimisation CAD (DfAM) depuis notre atelier dans la zone industrielle La Atalaya.",
    uploadStl: "Envoyer Fichier STL",
    viewServices: "Voir Technologies et Matériaux",
    expressHours: "Délai express 24/48h",
    precisionTech: "FDM & SLA Industriel",
    hybridClients: "Clients B2B & B2C",
    step1: "1. Données Client",
    step2: "2. Fichier STL & Viseur",
    step3: "3. Spécifications",
    step4: "4. Résumé & Envoi",
    next: "Étape Suivante",
    prev: "Précédent",
    submit: "Envoyer la Demande de Devis",
    notice: "Le montant affiché est une estimation indicative. Un technicien PROJET 3D examinera la géométrie de votre fichier .STL et vous enverra le devis définitif approuvé dans un délai maximum de 24 heures."
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "services" | "quote" | "process" | "about" | "contact" | "admin">("home");
  const [lang, setLang] = useState<Language>("es");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth & Workspace state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [workspaceMsg, setWorkspaceMsg] = useState("");

  // Quote Wizard Step
  const [quoteStep, setQuoteStep] = useState<1 | 2 | 3 | 4>(1);

  // Quote form state
  const [file, setFile] = useState<{ name: string; size: number; volume: number; hours: number; x: number; y: number; z: number } | null>({
    name: "soporte_industrial_v2.stl",
    size: 2450000,
    volume: 68.5,
    hours: 5.2,
    x: 85.0,
    y: 42.5,
    z: 30.0
  });
  const [technology, setTechnology] = useState<"FDM" | "SLA">("FDM");
  const [material, setMaterial] = useState<string>("PETG Negro");
  const [finish, setFinish] = useState<string>("Básico / En Bruto");
  const [units, setUnits] = useState<number>(1);
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");

  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [observations, setObservations] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<QuoteItem | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Admin state
  const [quotesList, setQuotesList] = useState<QuoteItem[]>([]);
  const [selectedAdminQuote, setSelectedAdminQuote] = useState<QuoteItem | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [adminStatusInput, setAdminStatusInput] = useState<QuoteItem["status"]>("En revisión");

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; text: string }>>([
    { role: "model", text: "¡Hola! Soy el asistente virtual de PROJET 3D. ¿En qué puedo ayudarte hoy con tus prototipos, archivos .STL o presupuestos?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Three.js Viewer Ref
  const mountRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  useEffect(() => {
    fetchQuotes();
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (e) {
      console.error("Login error", e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (activeTab === "quote" && quoteStep === 2 && mountRef.current) {
      const container = mountRef.current;
      container.innerHTML = "";
      const width = container.clientWidth || 400;
      const height = container.clientHeight || 300;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x121217);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 120);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0x00A8E8, 1.2);
      directionalLight.position.set(50, 100, 50);
      scene.add(directionalLight);

      let geometry: THREE.BufferGeometry;
      if (technology === "FDM") {
        geometry = new THREE.BoxGeometry(45, 45, 20);
      } else {
        geometry = new THREE.CylinderGeometry(25, 25, 35, 32);
      }

      const materialMesh = new THREE.MeshStandardMaterial({
        color: technology === "FDM" ? 0x00A8E8 : 0x888899,
        roughness: 0.3,
        metalness: 0.2,
      });

      const mesh = new THREE.Mesh(geometry, materialMesh);
      scene.add(mesh);

      let animationFrameId: number;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    }
  }, [activeTab, quoteStep, technology]);

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  const fetchQuotes = async () => {
    try {
      const res = await fetch("/api/quotes");
      const data = await res.json();
      setQuotesList(data);
    } catch (e) {
      console.error("Failed to fetch quotes", e);
    }
  };

  const calculateEstimatedPrice = () => {
    const volume = file ? file.volume : 50;
    const hours = file ? file.hours : 4;
    const factorMaterial = technology === "SLA" ? 0.35 : 0.20;
    const basePrep = 5;
    const hourlyRate = 12;

    let subtotal = basePrep + (volume * factorMaterial) + (hours * hourlyRate);
    if (subtotal < 15) subtotal = 15;
    if (urgency === "urgent") {
      subtotal *= 1.30;
    }
    return Math.round(subtotal * units * 100) / 100;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (uploaded) {
      const randomVol = Math.round((Math.random() * 80 + 20) * 10) / 10;
      const randomHours = Math.round((randomVol * 0.08 + 1) * 10) / 10;
      setFile({
        name: uploaded.name,
        size: uploaded.size,
        volume: randomVol,
        hours: randomHours,
        x: Math.round(Math.random() * 50 + 40),
        y: Math.round(Math.random() * 40 + 30),
        z: Math.round(Math.random() * 30 + 15)
      });
    }
  };

  const handleSelectSampleSTL = (sampleName: string, vol: number, hrs: number, x: number, y: number, z: number) => {
    setFile({
      name: sampleName,
      size: 1850000,
      volume: vol,
      hours: hrs,
      x, y, z
    });
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !email || !phone) {
      setErrorMsg("Por favor, completa los campos obligatorios (Nombre, Email y Teléfono).");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);

    try {
      const payload = {
        clientName,
        email,
        phone,
        company,
        technology,
        material,
        finish,
        units,
        urgency,
        fileName: file ? file.name : "modelo.stl",
        fileSize: file ? file.size : 1024000,
        volumeCm3: file ? file.volume : 50,
        estimatedHours: file ? file.hours : 4,
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittedQuote(data);
        fetchQuotes();
      } else {
        setErrorMsg(data.error || "Error al enviar la solicitud.");
      }
    } catch (err: any) {
      setErrorMsg("Error de conexión con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userText }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${userText} [Idioma preferido: ${lang.toUpperCase()}]`,
          history: chatMessages.slice(-6)
        })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "model", text: data.reply || "Lo siento, no he podido responder." }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "model", text: "Error de comunicación con el asistente." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleUpdateAdminStatus = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: adminStatusInput,
          adminNotes: adminNoteInput
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedAdminQuote(updated);
        fetchQuotes();
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  // Google Workspace Handlers
  const handleAddToCalendar = async (quote: QuoteItem) => {
    if (!token) {
      alert("Inicia sesión con Google para usar Google Calendar.");
      return;
    }
    try {
      const now = new Date();
      const start = new Date(now.getTime() + 3600000 * 24).toISOString();
      const end = new Date(now.getTime() + 3600000 * 25).toISOString();
      await createCalendarEvent(
        token,
        `Revisión 3D: ${quote.id} - ${quote.clientName}`,
        `Revisión técnica de malla STL (${quote.fileName}), Material: ${quote.material}, Tecnología: ${quote.technology}`,
        start,
        end
      );
      setWorkspaceMsg(`Evento programado con éxito en Google Calendar para la solicitud ${quote.id}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddToTasks = async (quote: QuoteItem) => {
    if (!token) {
      alert("Inicia sesión con Google para usar Google Tasks.");
      return;
    }
    try {
      await createGoogleTask(
        token,
        `Fabricar ${quote.units}x ${quote.fileName} (${quote.technology})`,
        `Cliente: ${quote.clientName} (${quote.email}), Material: ${quote.material}, Acabado: ${quote.finish}`
      );
      setWorkspaceMsg(`Tarea añadida con éxito a Google Tasks para la solicitud ${quote.id}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSlides = async (quote: QuoteItem) => {
    if (!token) {
      alert("Inicia sesión con Google para usar Google Slides.");
      return;
    }
    try {
      await createGoogleSlideDeck(token, `Presupuesto ${quote.id} - ${quote.clientName}`);
      setWorkspaceMsg(`Presentación de Google Slides creada para la solicitud ${quote.id}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateMeet = async () => {
    if (!token) {
      alert("Inicia sesión con Google para usar Google Meet.");
      return;
    }
    try {
      const meet = await createGoogleMeetSpace(token);
      alert(`Sala de Google Meet creada con éxito: ${meet.meetingUri || meet.uri || 'Creada en Workspace'}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1E1E24] font-sans antialiased flex flex-col">
      {/* Top Bar Contract */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("home")}>
          <span className="text-xl font-bold tracking-tight text-[#1E1E24] flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#00A8E8]" />
            PROJET <span className="text-[#00A8E8]">3D</span>
          </span>
        </div>

        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button onClick={() => setActiveTab("home")} className={`transition-colors hover:text-[#00A8E8] ${activeTab === "home" ? "text-[#00A8E8] font-semibold" : ""}`}>{t.home}</button>
          <button onClick={() => setActiveTab("services")} className={`transition-colors hover:text-[#00A8E8] ${activeTab === "services" ? "text-[#00A8E8] font-semibold" : ""}`}>{t.services}</button>
          <button onClick={() => setActiveTab("quote")} className={`transition-colors hover:text-[#00A8E8] ${activeTab === "quote" ? "text-[#00A8E8] font-semibold" : ""}`}>{t.quote}</button>
          <button onClick={() => setActiveTab("process")} className={`transition-colors hover:text-[#00A8E8] ${activeTab === "process" ? "text-[#00A8E8] font-semibold" : ""}`}>{t.process}</button>
          <button onClick={() => setActiveTab("about")} className={`transition-colors hover:text-[#00A8E8] ${activeTab === "about" ? "text-[#00A8E8] font-semibold" : ""}`}>{t.about}</button>
          <button onClick={() => setActiveTab("contact")} className={`transition-colors hover:text-[#00A8E8] ${activeTab === "contact" ? "text-[#00A8E8] font-semibold" : ""}`}>{t.contact}</button>
        </nav>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 text-xs font-medium">
            <Globe className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <button onClick={() => setLang("es")} className={`px-2 py-1 rounded-md transition-colors ${lang === 'es' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>ES</button>
            <button onClick={() => setLang("en")} className={`px-2 py-1 rounded-md transition-colors ${lang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>EN</button>
            <button onClick={() => setLang("fr")} className={`px-2 py-1 rounded-md transition-colors ${lang === 'fr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>FR</button>
          </div>

          {!user ? (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isLoggingIn ? "Conectando..." : "Sign in with Google"}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{user.displayName || user.email}</span>
              <button
                onClick={logout}
                className="px-2.5 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                Salir
              </button>
            </div>
          )}

          <button
            onClick={() => setActiveTab("quote")}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#00A8E8] rounded-lg hover:bg-[#008bc4] transition-colors whitespace-nowrap shadow-sm"
          >
            {t.reqQuote}
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${activeTab === "admin" ? "bg-[#1E1E24] text-white border-[#1E1E24]" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"}`}
            title="Panel Backoffice"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.admin}</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-700 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {workspaceMsg && (
        <div className="bg-emerald-600 text-white text-xs py-2 px-6 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {workspaceMsg}
          <button onClick={() => setWorkspaceMsg("")} className="ml-4 underline font-semibold">Cerrar</button>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3 shadow-lg z-40">
          <button onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }} className="text-left py-2 font-medium text-slate-700 hover:text-[#00A8E8]">{t.home}</button>
          <button onClick={() => { setActiveTab("services"); setMobileMenuOpen(false); }} className="text-left py-2 font-medium text-slate-700 hover:text-[#00A8E8]">{t.services}</button>
          <button onClick={() => { setActiveTab("quote"); setMobileMenuOpen(false); }} className="text-left py-2 font-medium text-slate-700 hover:text-[#00A8E8]">{t.quote}</button>
          <button onClick={() => { setActiveTab("process"); setMobileMenuOpen(false); }} className="text-left py-2 font-medium text-slate-700 hover:text-[#00A8E8]">{t.process}</button>
          <button onClick={() => { setActiveTab("about"); setMobileMenuOpen(false); }} className="text-left py-2 font-medium text-slate-700 hover:text-[#00A8E8]">{t.about}</button>
          <button onClick={() => { setActiveTab("contact"); setMobileMenuOpen(false); }} className="text-left py-2 font-medium text-slate-700 hover:text-[#00A8E8]">{t.contact}</button>
        </div>
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {activeTab === "home" && (
          <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative bg-[#1E1E24] text-white py-24 px-6 overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url('/src/assets/images/hero_3d_printer_1791193241809.jpg')` }} />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1E1E24] via-[#1E1E24]/90 to-transparent" />
              <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col gap-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A8E8]/20 text-[#00A8E8] text-xs font-semibold w-fit border border-[#00A8E8]/30">
                    <Boxes className="w-3.5 h-3.5" /> Fabricación Aditiva Profesional & Prototipado
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                    {t.heroTitle} <span className="text-[#00A8E8]">{t.heroHighlight}</span>
                  </h1>
                  <p className="text-slate-300 text-lg max-w-xl">
                    {t.heroSubtitle}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <button
                      onClick={() => setActiveTab("quote")}
                      className="px-6 py-3.5 text-sm font-semibold text-white bg-[#00A8E8] rounded-xl hover:bg-[#008bc4] transition-all shadow-lg shadow-[#00A8E8]/20 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> {t.uploadStl}
                    </button>
                    <button
                      onClick={() => setActiveTab("services")}
                      className="px-6 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20"
                    >
                      {t.viewServices}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800 text-slate-400 text-sm">
                    <div>
                      <span className="block text-2xl font-bold text-white">24/48h</span>
                      {t.expressHours}
                    </div>
                    <div>
                      <span className="block text-2xl font-bold text-white">FDM & SLA</span>
                      {t.precisionTech}
                    </div>
                    <div>
                      <span className="block text-2xl font-bold text-white">B2B & B2C</span>
                      {t.hybridClients}
                    </div>
                  </div>
                </div>
                <div className="hidden lg:flex justify-center">
                  <div className="relative w-full max-w-md aspect-4/3 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900">
                    <img
                      src="/src/assets/images/service_fdm_sla_1791193252800.jpg"
                      alt="Fabricación aditiva PROJET 3D"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                      <p className="text-xs text-slate-300 font-medium">Piezas mecánicas funcionales impresas en PETG y Resina Técnica.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Services Preview */}
            <section className="py-20 px-6 max-w-7xl mx-auto w-full">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#00A8E8]">Tecnologías de Vanguardia</span>
                <h2 className="text-3xl font-bold text-[#1E1E24] mt-2">Capacidades de Fabricación Aditiva</h2>
                <p className="text-slate-600 mt-3">Combinamos el rigor de la ingeniería con la versatilidad de la impresión 3D para dar forma a cualquier geometría.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center mb-6 font-bold text-lg">01</div>
                    <h3 className="text-xl font-bold text-[#1E1E24]">Impresión 3D FDM</h3>
                    <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                      Modelado por Deposición Fundida ideal para piezas funcionales, utilitarias, utillajes y prototipos de gran tamaño con alta resistencia mecánica.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">PLA / ABS</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">PETG</span>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("quote")} className="mt-8 text-xs font-semibold text-[#00A8E8] flex items-center gap-1 hover:underline">
                    Cotizar FDM <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center mb-6 font-bold text-lg">02</div>
                    <h3 className="text-xl font-bold text-[#1E1E24]">Impresión 3D SLA / Resina</h3>
                    <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                      Estereolitografía por resina para máxima definición geométrica, superficies lisas sin marcas de capa, miniaturas y componentes de precisión.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">Resina Standard</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">Tough / ABS-Like</span>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("quote")} className="mt-8 text-xs font-semibold text-[#00A8E8] flex items-center gap-1 hover:underline">
                    Cotizar SLA <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center mb-6 font-bold text-lg">03</div>
                    <h3 className="text-xl font-bold text-[#1E1E24]">Post-procesado & DfAM</h3>
                    <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                      Asesoría de diseño para fabricación aditiva (DfAM), ingeniería inversa y acabados profesionales (lijado, pulido, imprimación y pintura).
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">Lijado & Pulido</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">Pintado Profesional</span>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("services")} className="mt-8 text-xs font-semibold text-[#00A8E8] flex items-center gap-1 hover:underline">
                    Ver más servicios <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* Workflow Steps Preview */}
            <section className="bg-slate-100 py-20 px-6">
              <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#00A8E8]">Simple & Transparente</span>
                  <h2 className="text-3xl font-bold text-[#1E1E24] mt-2">¿Cómo Trabajamos en PROJET 3D?</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-3xl font-extrabold text-[#00A8E8] mb-3">01</div>
                    <h3 className="font-bold text-[#1E1E24] text-lg">Envío de STL</h3>
                    <p className="text-slate-600 text-sm mt-2">Sube tu archivo 3D (.STL), elige material, acabado y unidades en nuestro cotizador.</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-3xl font-extrabold text-[#00A8E8] mb-3">02</div>
                    <h3 className="font-bold text-[#1E1E24] text-lg">Revisión & Presupuesto</h3>
                    <p className="text-slate-600 text-sm mt-2">Un técnico valida la malla y confirma el presupuesto exacto en menos de 24h.</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-3xl font-extrabold text-[#00A8E8] mb-3">03</div>
                    <h3 className="font-bold text-[#1E1E24] text-lg">Fabricación Aditiva</h3>
                    <p className="text-slate-600 text-sm mt-2">Producimos tu pieza bajo estrictos controles de calidad en nuestro taller.</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-3xl font-extrabold text-[#00A8E8] mb-3">04</div>
                    <h3 className="font-bold text-[#1E1E24] text-lg">Entrega Exprés</h3>
                    <p className="text-slate-600 text-sm mt-2">Recibe tu prototipo en 24/48h o recógelo directamente en nuestras instalaciones.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "services" && (
          <div className="max-w-7xl mx-auto py-16 px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00A8E8]">Catálogo Integral</span>
              <h1 className="text-4xl font-extrabold text-[#1E1E24] mt-2">Servicios y Materiales PROJET 3D</h1>
              <p className="text-slate-600 mt-3">Ofrecemos soluciones personalizadas tanto para ingenierías y empresas (B2B) como para creadores y particulares (B2C).</p>
            </div>

            <div className="space-y-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <span className="text-xs font-semibold bg-[#00A8E8]/10 text-[#00A8E8] px-3 py-1 rounded-full">Tecnología FDM</span>
                  <h2 className="text-2xl font-bold text-[#1E1E24] mt-4">Modelado por Deposición Fundida (FDM)</h2>
                  <p className="text-slate-600 mt-4 leading-relaxed">
                    La tecnología FDM funde y deposita filamento polimérico capa por capa. Es la opción más versátil y económica para prototipos funcionales, piezas mecánicas robustas y tiradas de tamaño medio y grande.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A8E8]" /> <strong>PLA:</strong> Ecológico, bajo coste, ideal para maquetas y prototipos estéticos.</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A8E8]" /> <strong>ABS:</strong> Alta resistencia térmica y mecánica para piezas industriales.</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A8E8]" /> <strong>PETG:</strong> Excelente tenacidad, resistencia química y transparencia moderada.</li>
                  </ul>
                  <button onClick={() => { setActiveTab("quote"); setQuoteStep(2); }} className="mt-8 px-5 py-3 text-xs font-semibold text-white bg-[#1E1E24] rounded-xl hover:bg-slate-800 transition-colors">
                    Cotizar Pieza FDM
                  </button>
                </div>
                <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img src="/src/assets/images/service_fdm_sla_1791193252800.jpg" alt="FDM Printing" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm">
                <div className="order-2 lg:order-1 aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img src="/src/assets/images/workshop_atalaya_1791193271648.jpg" alt="SLA Printing" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="order-1 lg:order-2">
                  <span className="text-xs font-semibold bg-[#00A8E8]/10 text-[#00A8E8] px-3 py-1 rounded-full">Tecnología SLA / Resina</span>
                  <h2 className="text-2xl font-bold text-[#1E1E24] mt-4">Estereolitografía por Resina (SLA)</h2>
                  <p className="text-slate-600 mt-4 leading-relaxed">
                    La estereolitografía utiliza un haz láser UV para curar y solidificar resina líquida con resoluciones microscópicas. Perfecta para carcasas complejas, modelos dentales, joyería y prototipos con acabados fotográficos.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A8E8]" /> <strong>Resina Standard:</strong> Máximo detalle superficial, esquinas vivas y texturas lisas.</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00A8E8]" /> <strong>Resina Tough (ABS-Like):</strong> Mayor resistencia al impacto y flexibilidad controlada.</li>
                  </ul>
                  <button onClick={() => { setActiveTab("quote"); setQuoteStep(2); }} className="mt-8 px-5 py-3 text-xs font-semibold text-white bg-[#1E1E24] rounded-xl hover:bg-slate-800 transition-colors">
                    Cotizar Pieza SLA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "quote" && (
          <div className="max-w-7xl mx-auto py-16 px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00A8E8]">Cotizador Interactivo .STL</span>
              <h1 className="text-4xl font-extrabold text-[#1E1E24] mt-2">Calcula tu Presupuesto al Instante</h1>
              <p className="text-slate-600 mt-3">Sube tu archivo .STL o selecciona una muestra de prueba. Configura material, tecnología y acabados para obtener una estimación inmediata.</p>
            </div>

            {submittedQuote ? (
              <div className="max-w-2xl mx-auto bg-white p-8 sm:p-10 rounded-2xl border border-emerald-200 shadow-lg text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E1E24]">¡Solicitud de Presupuesto Registrada!</h2>
                <p className="text-slate-600 mt-2">Referencia de Solicitud: <strong className="text-[#00A8E8]">{submittedQuote.id}</strong></p>
                <div className="bg-slate-50 p-6 rounded-xl text-left border border-slate-200 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Archivo:</span> <strong className="text-slate-900">{submittedQuote.fileName}</strong></div>
                  <div className="flex justify-between"><span>Tecnología / Material:</span> <strong className="text-slate-900">{submittedQuote.technology} - {submittedQuote.material}</strong></div>
                  <div className="flex justify-between"><span>Acabado:</span> <strong className="text-slate-900">{submittedQuote.finish}</strong></div>
                  <div className="flex justify-between"><span>Unidades:</span> <strong className="text-slate-900">{submittedQuote.units}</strong></div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                    <span>Estimación Inicial:</span>
                    <strong className="text-[#00A8E8] text-lg">{submittedQuote.estimatedPrice.toFixed(2)} €</strong>
                  </div>
                </div>

                {/* Google Workspace Integration Actions on Success */}
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 text-left space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">Integración Google Workspace</h4>
                  <p className="text-xs text-blue-700">Gestiona este encargo directamente en tus herramientas de Google:</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleAddToCalendar(submittedQuote)}
                      className="px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-blue-800 hover:bg-blue-100 flex items-center gap-1.5 shadow-sm"
                    >
                      <Calendar className="w-4 h-4 text-blue-600" /> Programar en Calendar
                    </button>
                    <button
                      onClick={() => handleAddToTasks(submittedQuote)}
                      className="px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-blue-800 hover:bg-blue-100 flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckSquare className="w-4 h-4 text-blue-600" /> Añadir a Google Tasks
                    </button>
                    <button
                      onClick={() => handleCreateSlides(submittedQuote)}
                      className="px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-blue-800 hover:bg-blue-100 flex items-center gap-1.5 shadow-sm"
                    >
                      <Presentation className="w-4 h-4 text-blue-600" /> Crear Google Slides
                    </button>
                    <button
                      onClick={handleCreateMeet}
                      className="px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-blue-800 hover:bg-blue-100 flex items-center gap-1.5 shadow-sm"
                    >
                      <Video className="w-4 h-4 text-blue-600" /> Iniciar Google Meet
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl text-amber-800 text-xs text-left border border-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                  <span>{t.notice}</span>
                </div>
                <button
                  onClick={() => { setSubmittedQuote(null); setQuoteStep(1); }}
                  className="px-6 py-3 bg-[#1E1E24] text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm"
                >
                  Solicitar Nuevo Presupuesto
                </button>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Wizard Steps Header */}
                <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-center">
                  <div className={`py-4 px-2 border-r border-slate-200 ${quoteStep === 1 ? 'bg-white text-[#00A8E8] border-b-2 border-b-[#00A8E8]' : 'text-slate-500'}`}>{t.step1}</div>
                  <div className={`py-4 px-2 border-r border-slate-200 ${quoteStep === 2 ? 'bg-white text-[#00A8E8] border-b-2 border-b-[#00A8E8]' : 'text-slate-500'}`}>{t.step2}</div>
                  <div className={`py-4 px-2 border-r border-slate-200 ${quoteStep === 3 ? 'bg-white text-[#00A8E8] border-b-2 border-b-[#00A8E8]' : 'text-slate-500'}`}>{t.step3}</div>
                  <div className={`py-4 px-2 ${quoteStep === 4 ? 'bg-white text-[#00A8E8] border-b-2 border-b-[#00A8E8]' : 'text-slate-500'}`}>{t.step4}</div>
                </div>

                <div className="p-8 sm:p-12">
                  {quoteStep === 1 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-[#1E1E24] mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-[#00A8E8]" /> Paso 1: Datos Básicos del Cliente
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre y Apellidos *</label>
                          <input
                            type="text"
                            required
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Ej. Carlos Méndez"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#00A8E8]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa / NIF (Opcional)</label>
                          <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="Méndez Ingenieros SL"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#00A8E8]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="carlos@ingenieria.es"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#00A8E8]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+34 600 000 000"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#00A8E8]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-6 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            if (!clientName || !email || !phone) {
                              setErrorMsg("Por favor, completa los campos obligatorios.");
                              return;
                            }
                            setErrorMsg("");
                            setQuoteStep(2);
                          }}
                          className="px-6 py-3 bg-[#00A8E8] text-white font-semibold rounded-xl hover:bg-[#008bc4] transition-colors text-sm flex items-center gap-2"
                        >
                          {t.next} <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {quoteStep === 2 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-[#1E1E24] mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-[#00A8E8]" /> Paso 2: Carga de Archivo .STL & Visor 3D
                      </h3>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-slate-300 hover:border-[#00A8E8] rounded-xl p-6 text-center bg-slate-50 transition-colors cursor-pointer relative">
                            <input
                              type="file"
                              accept=".stl"
                              onChange={handleFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-slate-700">Arrastra tu archivo .STL (Máx. 50 MB)</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">O prueba con un modelo de muestra:</p>
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => handleSelectSampleSTL("soporte_mecanico.stl", 45.2, 3.8, 80, 50, 25)} className="text-xs bg-slate-100 hover:bg-[#00A8E8]/10 hover:text-[#00A8E8] text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                                Soporte Mecánico (45 cm³)
                              </button>
                              <button onClick={() => handleSelectSampleSTL("carcasa_iot.stl", 82.0, 6.5, 110, 75, 40)} className="text-xs bg-slate-100 hover:bg-[#00A8E8]/10 hover:text-[#00A8E8] text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                                Carcasa IoT (82 cm³)
                              </button>
                            </div>
                          </div>

                          {file && (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                              <div className="flex justify-between"><span>Archivo:</span> <strong className="text-slate-900">{file.name}</strong></div>
                              <div className="flex justify-between"><span>Volumen Calculado:</span> <strong className="text-[#00A8E8]">{file.volume} cm³</strong></div>
                              <div className="flex justify-between"><span>Dimensiones (X × Y × Z):</span> <strong className="text-slate-900">{file.x} × {file.y} × {file.z} mm</strong></div>
                            </div>
                          )}
                        </div>

                        {/* 3D Viewer */}
                        <div>
                          <div ref={mountRef} className="w-full h-64 rounded-xl bg-[#121217] overflow-hidden relative shadow-inner flex items-center justify-center">
                            {!file && <span className="text-slate-500 text-xs">Cargue un archivo .STL</span>}
                          </div>
                          <p className="text-[11px] text-slate-500 text-center mt-2">Visor 3D Three.js: Rotación e inspección geométrica.</p>
                        </div>
                      </div>

                      <div className="flex justify-between pt-6 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setQuoteStep(1)}
                          className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                        >
                          {t.prev}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuoteStep(3)}
                          className="px-6 py-3 bg-[#00A8E8] text-white font-semibold rounded-xl hover:bg-[#008bc4] transition-colors text-sm flex items-center gap-2"
                        >
                          {t.next} <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {quoteStep === 3 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-[#1E1E24] mb-4 flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-[#00A8E8]" /> Paso 3: Configuración del Trabajo
                      </h3>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Tecnología de Fabricación</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => { setTechnology("FDM"); setMaterial("PETG Negro"); }}
                            className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all text-center ${technology === "FDM" ? "border-[#00A8E8] bg-[#00A8E8]/10 text-[#00A8E8]" : "border-slate-200 text-slate-700"}`}
                          >
                            FDM (Filamento)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setTechnology("SLA"); setMaterial("Resina Estándar Gris"); }}
                            className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all text-center ${technology === "SLA" ? "border-[#00A8E8] bg-[#00A8E8]/10 text-[#00A8E8]" : "border-slate-200 text-slate-700"}`}
                          >
                            SLA (Resina Alta Definición)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Material</label>
                          <select
                            value={material}
                            onChange={(e) => setMaterial(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
                          >
                            {technology === "FDM" ? (
                              <>
                                <option value="PLA Negro">PLA Negro (Económico / Estético)</option>
                                <option value="PLA Blanco">PLA Blanco</option>
                                <option value="ABS Negro">ABS Negro (Alta Resistencia)</option>
                                <option value="PETG Negro">PETG Negro (Equilibrio Mecánico)</option>
                              </>
                            ) : (
                              <>
                                <option value="Resina Estándar Gris">Resina Estándar Gris (Alta Definición)</option>
                                <option value="Resina Estándar Negra">Resina Estándar Negra</option>
                                <option value="Resina Tough ABS-Like">Resina Tough ABS-Like (Resistente)</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Acabado Superficial</label>
                          <select
                            value={finish}
                            onChange={(e) => setFinish(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
                          >
                            <option value="Básico / En Bruto">Básico / En Bruto (Retirada de soportes)</option>
                            <option value="Lijado y Pulido">Lijado y Pulido (Suavizado de capas)</option>
                            <option value="Imprimado / Pintado">Imprimado / Pintado Profesional</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Unidades (Descuento automático a partir de 10 uds)</label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={units}
                            onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Plazo de Entrega</label>
                          <select
                            value={urgency}
                            onChange={(e) => setUrgency(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
                          >
                            <option value="normal">Estándar (3-5 días hábiles)</option>
                            <option value="urgent">Urgente 24/48h (+30% suplemento)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Observaciones / Instrucciones especiales</label>
                        <textarea
                          rows={2}
                          value={observations}
                          onChange={(e) => setObservations(e.target.value)}
                          placeholder="Indicaciones sobre inserción de roscas, tolerancias o colores específicos..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
                        />
                      </div>

                      <div className="flex justify-between pt-6 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setQuoteStep(2)}
                          className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                        >
                          {t.prev}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuoteStep(4)}
                          className="px-6 py-3 bg-[#00A8E8] text-white font-semibold rounded-xl hover:bg-[#008bc4] transition-colors text-sm flex items-center gap-2"
                        >
                          {t.next} <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {quoteStep === 4 && (
                    <form onSubmit={handleSubmitQuote} className="space-y-6">
                      <h3 className="text-xl font-bold text-[#1E1E24] mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#00A8E8]" /> Paso 4: Resumen y Estimación
                      </h3>

                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3 text-sm">
                        <div className="flex justify-between"><span>Cliente:</span> <strong className="text-slate-900">{clientName} ({email})</strong></div>
                        <div className="flex justify-between"><span>Archivo STL:</span> <strong className="text-slate-900">{file?.name} ({file?.volume} cm³)</strong></div>
                        <div className="flex justify-between"><span>Tecnología / Material:</span> <strong className="text-slate-900">{technology} - {material}</strong></div>
                        <div className="flex justify-between"><span>Acabado / Unidades:</span> <strong className="text-slate-900">{finish} · {units} ud(s)</strong></div>
                        <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
                          <span>Precio Estimado Orientativo:</span>
                          <span className="text-[#00A8E8]">{calculateEstimatedPrice().toFixed(2)} €</span>
                        </div>
                      </div>

                      <div className="bg-amber-50 p-4 rounded-xl text-amber-800 text-xs border border-amber-200 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                        <span>{t.notice}</span>
                      </div>

                      {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200">
                          {errorMsg}
                        </div>
                      )}

                      <div className="flex justify-between pt-6 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setQuoteStep(3)}
                          className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                        >
                          {t.prev}
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-8 py-3 bg-[#00A8E8] hover:bg-[#008bc4] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#00A8E8]/30 flex items-center gap-2 disabled:opacity-50 text-sm"
                        >
                          {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {t.submit}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "process" && (
          <div className="max-w-7xl mx-auto py-16 px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00A8E8]">Metodología Rigurosa</span>
              <h1 className="text-4xl font-extrabold text-[#1E1E24] mt-2">Del Archivo STL a la Pieza Real</h1>
              <p className="text-slate-600 mt-3">Garantizamos trazabilidad total, confidencialidad estricta y control de calidad en cada una de las fases del proceso.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
                <span className="text-4xl font-black text-slate-200 absolute top-6 right-6">01</span>
                <h3 className="text-xl font-bold text-[#1E1E24] mb-3">1. Subida & Slicing</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Carga segura de tu modelo 3D en formato `.STL`. Nuestro sistema analiza el volumen, orientación y parámetros óptimos de fabricación.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
                <span className="text-4xl font-black text-slate-200 absolute top-6 right-6">02</span>
                <h3 className="text-xl font-bold text-[#1E1E24] mb-3">2. Revisión Técnica</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Un ingeniero de PROJET 3D revisa la integridad de la malla, espesores mínimos y tolerancias antes de emitir la validación definitiva.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
                <span className="text-4xl font-black text-slate-200 absolute top-6 right-6">03</span>
                <h3 className="text-xl font-bold text-[#1E1E24] mb-3">3. Fabricación Aditiva</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Producción en nuestras impresoras profesionales FDM o SLA con el material y acabado seleccionados bajo estrictos estándares industriales.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
                <span className="text-4xl font-black text-slate-200 absolute top-6 right-6">04</span>
                <h3 className="text-xl font-bold text-[#1E1E24] mb-3">4. Entrega Exprés</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Envío urgente 24/48h a toda la península y Baleares, o recogida directa en nuestro taller del Polígono Industrial La Atalaya.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="max-w-7xl mx-auto py-16 px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#00A8E8]">Sobre PROJET 3D</span>
                <h1 className="text-4xl font-extrabold text-[#1E1E24] mt-2">Innovación y Precisión en Fabricación Aditiva</h1>
                <p className="text-slate-600 mt-4 leading-relaxed">
                  En <strong>PROJET 3D</strong> acompañamos a diseñadores, inventores, ingenieros y empresas desde la conceptualización hasta la fabricación de series cortas. Creemos firmemente que cualquier idea validada digitalmente merece un prototipo físico de máxima calidad.
                </p>
                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <MapPin className="w-6 h-6 text-[#00A8E8] mb-2" />
                    <h3 className="font-bold text-[#1E1E24]">Ubicación Física</h3>
                    <p className="text-slate-600 text-xs mt-1">Polígono Industrial La Atalaya, C/ Avenida de los Trabajadores, nº 25.</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <Clock className="w-6 h-6 text-[#00A8E8] mb-2" />
                    <h3 className="font-bold text-[#1E1E24]">Horario de Taller</h3>
                    <p className="text-slate-600 text-xs mt-1">Lunes a Viernes de 8:00 a 17:00 h.</p>
                  </div>
                </div>
              </div>
              <div className="aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900">
                <img src="/src/assets/images/workshop_atalaya_1791193271648.jpg" alt="Taller PROJET 3D" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="max-w-7xl mx-auto py-16 px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00A8E8]">Estamos a tu Disposición</span>
              <h1 className="text-4xl font-extrabold text-[#1E1E24] mt-2">Contacto Directo</h1>
              <p className="text-slate-600 mt-3">¿Tienes dudas técnicas o necesitas asesoramiento para un proyecto complejo? Escríbenos o visítanos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center mb-6">
                  <MapPin className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg text-[#1E1E24]">Ubicación del Taller</h3>
                <p className="text-slate-600 text-sm mt-2">Polígono Industrial La Atalaya<br />C/ Avenida de los Trabajadores, nº 25</p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center mb-6">
                  <Mail className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg text-[#1E1E24]">Correo Electrónico</h3>
                <p className="text-slate-600 text-sm mt-2">contacto@projet3d.es<br />soporte@projet3d.es</p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center mb-6">
                  <Phone className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg text-[#1E1E24]">Teléfono & WhatsApp</h3>
                <p className="text-slate-600 text-sm mt-2">+34 900 3D PROJET<br />L-V de 8:00 a 17:00 h</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="max-w-7xl mx-auto py-16 px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#00A8E8]">Panel Backoffice Interno</span>
                <h1 className="text-3xl font-extrabold text-[#1E1E24] mt-1">Gestión de Solicitudes y Presupuestos</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateMeet}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"
                >
                  <Video className="w-4 h-4" /> Crear Meet
                </button>
                <button
                  onClick={fetchQuotes}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Actualizar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                      <tr>
                        <th className="px-6 py-4">ID / Fecha</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Tecnología / Archivo</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-right">Precio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {quotesList.map((q) => (
                        <tr
                          key={q.id}
                          onClick={() => {
                            setSelectedAdminQuote(q);
                            setAdminStatusInput(q.status);
                            setAdminNoteInput(q.adminNotes || "");
                          }}
                          className={`cursor-pointer transition-colors hover:bg-slate-50 ${selectedAdminQuote?.id === q.id ? "bg-[#00A8E8]/5" : ""}`}
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {q.id}
                            <span className="block text-[11px] text-slate-400 font-normal">{new Date(q.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            {q.clientName}
                            <span className="block text-[11px] text-slate-500">{q.company || q.email}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold">{q.technology}</span> - {q.material}
                            <span className="block text-[11px] text-slate-400 truncate max-w-[140px]">{q.fileName}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              q.status === 'Recibida' ? 'bg-amber-100 text-amber-800' :
                              q.status === 'En revisión' ? 'bg-blue-100 text-blue-800' :
                              q.status === 'Presupuesto enviado' ? 'bg-purple-100 text-purple-800' :
                              q.status === 'En fabricación' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
                            {q.estimatedPrice.toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                {selectedAdminQuote ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-bold text-[#00A8E8]">{selectedAdminQuote.id}</span>
                        <h2 className="text-xl font-bold text-slate-900">{selectedAdminQuote.clientName}</h2>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">{selectedAdminQuote.estimatedPrice.toFixed(2)} €</span>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex justify-between"><span>Email:</span> <strong className="text-slate-800">{selectedAdminQuote.email}</strong></div>
                      <div className="flex justify-between"><span>Teléfono:</span> <strong className="text-slate-800">{selectedAdminQuote.phone}</strong></div>
                      <div className="flex justify-between"><span>Empresa:</span> <strong className="text-slate-800">{selectedAdminQuote.company || "Particular"}</strong></div>
                      <div className="flex justify-between"><span>Archivo STL:</span> <strong className="text-slate-800">{selectedAdminQuote.fileName}</strong></div>
                      <div className="flex justify-between"><span>Volumen:</span> <strong className="text-slate-800">{selectedAdminQuote.volumeCm3} cm³ ({selectedAdminQuote.units} ud.)</strong></div>
                      <div className="flex justify-between"><span>Acabado:</span> <strong className="text-slate-800">{selectedAdminQuote.finish}</strong></div>
                    </div>

                    {/* Google Workspace Integration Buttons in Admin */}
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Herramientas Google Workspace:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAddToCalendar(selectedAdminQuote)}
                          className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold hover:bg-blue-100 flex items-center justify-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Calendar
                        </button>
                        <button
                          onClick={() => handleAddToTasks(selectedAdminQuote)}
                          className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-100 flex items-center justify-center gap-1.5"
                        >
                          <CheckSquare className="w-3.5 h-3.5" /> Tasks
                        </button>
                        <button
                          onClick={() => handleCreateSlides(selectedAdminQuote)}
                          className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold hover:bg-amber-100 flex items-center justify-center gap-1.5 col-span-2"
                        >
                          <Presentation className="w-3.5 h-3.5" /> Generar Google Slides
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Cambiar Estado</label>
                        <select
                          value={adminStatusInput}
                          onChange={(e) => setAdminStatusInput(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800"
                        >
                          <option value="Recibida">Recibida</option>
                          <option value="En revisión">En revisión</option>
                          <option value="Presupuesto enviado">Presupuesto enviado</option>
                          <option value="En fabricación">En fabricación</option>
                          <option value="Finalizado">Finalizado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Notas Técnicas / Internas</label>
                        <textarea
                          rows={2}
                          value={adminNoteInput}
                          onChange={(e) => setAdminNoteInput(e.target.value)}
                          placeholder="Añadir observaciones sobre la malla..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800"
                        />
                      </div>

                      <button
                        onClick={() => handleUpdateAdminStatus(selectedAdminQuote.id)}
                        className="w-full py-3 bg-[#00A8E8] hover:bg-[#008bc4] text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Selecciona una solicitud del listado para inspeccionar y gestionar sus estados.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-55">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="w-14 h-14 rounded-full bg-[#00A8E8] text-white shadow-2xl flex items-center justify-center hover:bg-[#008bc4] transition-all hover:scale-105"
            title="Asistente Virtual PROJET 3D"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Chat Header */}
            <div className="bg-[#1E1E24] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[#00A8E8]" />
                <div>
                  <h3 className="font-bold text-sm">Asistente PROJET 3D ({lang.toUpperCase()})</h3>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">● En línea</span>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-sm">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#00A8E8] text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl text-xs text-slate-500 border border-slate-200 shadow-sm flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00A8E8]" /> Pensando respuesta...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Footer Input */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pregunta sobre STL, FDM, SLA..."
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00A8E8]"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="p-2 bg-[#00A8E8] text-white rounded-xl hover:bg-[#008bc4] transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#1E1E24] text-slate-400 py-12 px-6 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <span className="text-lg font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#00A8E8]" /> PROJET 3D
            </span>
            <p className="text-xs leading-relaxed">
              Tú aportas la idea o el diseño. Nosotros nos encargamos de convertirlo en realidad. Fabricación aditiva e ingeniería de prototipos.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold mb-3">Ubicación</h4>
            <p className="text-xs leading-relaxed">
              Polígono Industrial La Atalaya<br />
              C/ Avenida de los Trabajadores, nº 25<br />
              España
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold mb-3">Contacto</h4>
            <p className="text-xs leading-relaxed">
              Email: contacto@projet3d.es<br />
              Tel: +34 900 3D PROJET<br />
              Horario: L-V 8:00 a 17:00 h
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold mb-3">Enlaces</h4>
            <div className="flex flex-col gap-2 text-xs">
              <button onClick={() => setActiveTab("services")} className="text-left hover:text-white transition-colors">Servicios FDM & SLA</button>
              <button onClick={() => setActiveTab("quote")} className="text-left hover:text-white transition-colors">Cotizador STL</button>
              <button onClick={() => setActiveTab("process")} className="text-left hover:text-white transition-colors">Proceso de Trabajo</button>
              <button onClick={() => setActiveTab("admin")} className="text-left hover:text-white transition-colors">Panel Backoffice</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} PROJET 3D. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
