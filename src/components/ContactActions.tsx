import { Phone, MessageSquare, Mail } from 'lucide-react';

interface ContactActionsProps {
  phone?: string | null;
  email?: string | null;
}

const ContactActions = ({ phone, email }: ContactActionsProps) => {
  if (!phone && !email) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {phone && (
        <>
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
          <a
            href={`sms:${phone}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Message
          </a>
        </>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          Email
        </a>
      )}
    </div>
  );
};

export default ContactActions;
