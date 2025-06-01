import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useLanguage } from "../features/LanguageContext"; // RUTA ACTUALIZADA
import type { LanguageCode } from "../features/LanguageContext"; // RUTA ACTUALIZADA
import "./ContactModal.css"; // Asegúrate que la ruta sea correcta o crea el archivo

// Definición de traducciones para el modal de contacto
const contactModalTranslations: Record<
  string,
  Partial<Record<LanguageCode, string>>
> = {
  title: {
    ES: "Formulario de Contacto",
    EN: "Contact Form",
    DE: "Kontaktformular",
  },
  nameLabel: {
    ES: "Nombre Completo",
    EN: "Full Name",
    DE: "Vollständiger Name",
  },
  namePlaceholder: {
    ES: "Escribe tu nombre completo",
    EN: "Enter your full name",
    DE: "Geben Sie Ihren vollständigen Namen ein",
  },
  emailLabel: {
    ES: "Correo Electrónico",
    EN: "Email Address",
    DE: "E-Mail-Addresse",
  },
  emailPlaceholder: {
    ES: "tu.email@ejemplo.com",
    EN: "your.email@example.com",
    DE: "ihre.email@beispiel.com",
  },
  subjectLabel: { ES: "Asunto", EN: "Subject", DE: "Betreff" },
  subjectPlaceholder: {
    ES: "Asunto de tu mensaje",
    EN: "Subject of your message",
    DE: "Betreff Ihrer Nachricht",
  },
  messageLabel: { ES: "Mensaje", EN: "Message", DE: "Nachricht" },
  messagePlaceholder: {
    ES: "Escribe tu mensaje aquí...",
    EN: "Write your message here...",
    DE: "Schreiben Sie hier Ihre Nachricht...",
  },
  sendButton: {
    ES: "Enviar Mensaje",
    EN: "Send Message",
    DE: "Nachricht senden",
  },
  sendingButton: {
    ES: "Enviando...",
    EN: "Sending...",
    DE: "Wird gesendet...",
  },
  closeButtonAriaLabel: {
    ES: "Cerrar modal de contacto",
    EN: "Close contact modal",
    DE: "Kontaktmodal schließen",
  },
  successMessage: {
    ES: "Gracias por contactarme. Pronto me pondré en contacto contigo.",
    EN: "Thank you for reaching out. I’ll get back to you soon.",
    DE: "Vielen Dank für Ihre Nachricht. Ich melde mich bald bei Ihnen.",
  },
  errorMessage: {
    ES: "Error al enviar el mensaje. Por favor, revisa los datos e inténtalo de nuevo.",
    EN: "Error sending message. Please check your data and try again.",
    DE: "Fehler beim Senden der Nachricht. Bitte überprüfen Sie Ihre Daten und versuchen Sie es erneut.",
  },
  validationNameRequired: {
    ES: "El nombre es obligatorio.",
    EN: "Name is required.",
    DE: "Name ist erforderlich.",
  },
  validationEmailRequired: {
    ES: "El correo electrónico es obligatorio.",
    EN: "Email is required.",
    DE: "E-Mail ist erforderlich.",
  },
  validationEmailInvalid: {
    ES: "El formato del correo electrónico no es válido.",
    EN: "Email format is invalid.",
    DE: "E-Mail-Format ist ungültig.",
  },
  validationSubjectRequired: {
    ES: "El asunto es obligatorio.",
    EN: "Subject is required.",
    DE: "Betreff ist erforderlich.",
  },
  validationMessageRequired: {
    ES: "El mensaje es obligatorio.",
    EN: "Message is required.",
    DE: "Nachricht ist erforderlich.",
  },
};

// Función para obtener las etiquetas traducidas
const getContactModalLabel = (key: string, lang: LanguageCode): string => {
  return (
    contactModalTranslations[key]?.[lang] ||
    contactModalTranslations[key]?.["ES"] ||
    key
  );
};

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  nombre_remitente: string;
  email_remitente: string;
  asunto: string;
  mensaje: string;
}

interface FormErrors {
  nombre_remitente?: string;
  email_remitente?: string;
  asunto?: string;
  mensaje?: string;
  form?: string; // Para errores generales del formulario
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { currentLanguage } = useLanguage();
  const [formData, setFormData] = useState<FormData>({
    nombre_remitente: "",
    email_remitente: "",
    asunto: "",
    mensaje: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre_remitente: "",
        email_remitente: "",
        asunto: "",
        mensaje: "",
      });
      setErrors({});
      setSubmitStatus(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (errors.form) {
      // Limpiar error general del formulario al empezar a escribir
      setErrors((prev) => ({ ...prev, form: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.nombre_remitente.trim())
      newErrors.nombre_remitente = getContactModalLabel(
        "validationNameRequired",
        currentLanguage
      );
    if (!formData.email_remitente.trim()) {
      newErrors.email_remitente = getContactModalLabel(
        "validationEmailRequired",
        currentLanguage
      );
    } else if (!/\S+@\S+\.\S+/.test(formData.email_remitente)) {
      newErrors.email_remitente = getContactModalLabel(
        "validationEmailInvalid",
        currentLanguage
      );
    }
    if (!formData.asunto.trim())
      // Asunto ahora es obligatorio según el validador
      newErrors.asunto = getContactModalLabel(
        "validationSubjectRequired",
        currentLanguage
      );
    if (!formData.mensaje.trim())
      // Mensaje ahora es obligatorio según el validador
      newErrors.mensaje = getContactModalLabel(
        "validationMessageRequired",
        currentLanguage
      );

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrors((prev) => ({ ...prev, form: undefined })); // Limpiar error de formulario anterior

    try {
      const API_ENDPOINT = "http://127.0.0.1:5000/mensajecontacto";
      const payload = {
        nombre_remitente: formData.nombre_remitente,
        email_remitente: formData.email_remitente,
        asunto: formData.asunto,
        mensaje: formData.mensaje,
      };
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            responseData.error ||
            `Error HTTP: ${response.status}`
        );
      }
      setSubmitStatus("success");
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error("Error al enviar el formulario:", error);
      const errorMessageToDisplay =
        error.message || getContactModalLabel("errorMessage", currentLanguage);
      setErrors((prev) => ({ ...prev, form: errorMessageToDisplay })); // Mostrar error de formulario
      setSubmitStatus("error"); // Establecer estado de error general
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="contact-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contactModalTitle"
    >
      <div
        className="contact-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="contact-modal-close-btn"
          onClick={onClose}
          aria-label={getContactModalLabel(
            "closeButtonAriaLabel",
            currentLanguage
          )}
        >
          &times;
        </button>
        <h2 id="contactModalTitle">
          {getContactModalLabel("title", currentLanguage)}
        </h2>

        {/* Mostrar mensaje de éxito global si no hay error de formulario específico */}
        {submitStatus === "success" && !errors.form && (
          <div className="contact-modal-message success" role="alert">
            {getContactModalLabel("successMessage", currentLanguage)}
          </div>
        )}

        {/* Mostrar error de formulario específico si existe */}
        {errors.form && (
          <div className="contact-modal-message error" role="alert">
            {errors.form}
          </div>
        )}
        {/* Mostrar mensaje de error global si submitStatus es error Y no hay un error.form específico (fallback) */}
        {submitStatus === "error" && !errors.form && (
          <div className="contact-modal-message error" role="alert">
            {getContactModalLabel("errorMessage", currentLanguage)}
          </div>
        )}

        {submitStatus !== "success" && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="nombre_remitente">
                {getContactModalLabel("nameLabel", currentLanguage)}
              </label>
              <input
                type="text"
                id="nombre_remitente"
                name="nombre_remitente"
                value={formData.nombre_remitente}
                onChange={handleChange}
                placeholder={getContactModalLabel(
                  "namePlaceholder",
                  currentLanguage
                )}
                required
                aria-invalid={!!errors.nombre_remitente}
                aria-describedby={
                  errors.nombre_remitente ? "nombre_remitente-error" : undefined
                }
              />
              {errors.nombre_remitente && (
                <p
                  id="nombre_remitente-error"
                  className="error-text"
                  role="alert"
                >
                  {errors.nombre_remitente}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email_remitente">
                {getContactModalLabel("emailLabel", currentLanguage)}
              </label>
              <input
                type="email"
                id="email_remitente"
                name="email_remitente"
                value={formData.email_remitente}
                onChange={handleChange}
                placeholder={getContactModalLabel(
                  "emailPlaceholder",
                  currentLanguage
                )}
                required
                aria-invalid={!!errors.email_remitente}
                aria-describedby={
                  errors.email_remitente ? "email_remitente-error" : undefined
                }
              />
              {errors.email_remitente && (
                <p
                  id="email_remitente-error"
                  className="error-text"
                  role="alert"
                >
                  {errors.email_remitente}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="asunto">
                {getContactModalLabel("subjectLabel", currentLanguage)}
              </label>
              <input
                type="text"
                id="asunto"
                name="asunto"
                value={formData.asunto}
                onChange={handleChange}
                placeholder={getContactModalLabel(
                  "subjectPlaceholder",
                  currentLanguage
                )}
                required
                aria-invalid={!!errors.asunto}
                aria-describedby={errors.asunto ? "asunto-error" : undefined}
              />
              {errors.asunto && (
                <p id="asunto-error" className="error-text" role="alert">
                  {errors.asunto}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="mensaje">
                {getContactModalLabel("messageLabel", currentLanguage)}
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                value={formData.mensaje}
                onChange={handleChange}
                placeholder={getContactModalLabel(
                  "messagePlaceholder",
                  currentLanguage
                )}
                rows={5}
                required
                aria-invalid={!!errors.mensaje}
                aria-describedby={errors.mensaje ? "mensaje-error" : undefined}
              ></textarea>
              {errors.mensaje && (
                <p id="mensaje-error" className="error-text" role="alert">
                  {errors.mensaje}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="contact-modal-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? getContactModalLabel("sendingButton", currentLanguage)
                : getContactModalLabel("sendButton", currentLanguage)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
