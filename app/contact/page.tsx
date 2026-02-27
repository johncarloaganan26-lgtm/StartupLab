'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toastError, toastSuccess } from '@/lib/toast';
import Link from 'next/link';
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useApp } from '@/contexts/app-context';

export default function ContactPage() {
  const { user } = useApp();
  const [contactName, setContactName] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [interest, setInterest] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Auto-fill form with user data when logged in
  useEffect(() => {
    if (user) {
      if (user.name) setContactName(user.name);
      if (user.email) setContactEmail(user.email);
      if (user.phone) setContactMobile(user.phone);
      if (user.company) setContactCompany(user.company);
    }
  }, [user]);

  const locationAddress =
    'StartupLab Business Center & AI Consultancy OPC, 2nd Floor, Pearl Plaza Building, General Trias, Cavite Philippines 4107';
  const mapsEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(locationAddress)}&output=embed`;
  const mapsLinkHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationAddress)}`;

  const interestOptions = [
    'Workshop',
    'Networking Session',
    'Mentorship',
    'Pitch Event',
    'All Events',
    'Other',
  ];

  const sendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;

    if (!contactName || !contactEmail || !contactMobile || !contactMessage) {
      toastError('Missing details', 'Please fill out all required fields.');
      return;
    }

    try {
      setIsSending(true);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          company: contactCompany,
          email: contactEmail,
          mobile: contactMobile,
          interest,
          message: contactMessage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send message.');
      }

      toastSuccess('Message sent', "Thanks! We'll get back to you soon.");
      setContactName('');
      setContactCompany('');
      setContactEmail('');
      setContactMobile('');
      setInterest('');
      setContactMessage('');
    } catch (err) {
      toastError('Send failed', err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="relative min-h-[35svh] min-h-[35vh]">
            <div className="absolute inset-0 bg-[url('/6d.jpg')] bg-cover bg-center bg-fixed" />
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-900/55 via-transparent to-transparent" />
          </div>

          <div className="absolute inset-0 flex items-center">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="max-w-2xl">
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                  Event Support
                </h1>
                <p className="mt-4 text-base lg:text-lg text-white/85 leading-relaxed">
                  Need help with events? Our support team is here to assist you with any questions about registrations, bookings, and event details.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-10">
            <Card className="border border-[#cfd9ec] shadow-none">
              <CardContent className="p-8 sm:p-10">
                <div className="mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Events Contact Support</h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Need help with event registrations or bookings? Fill out the form below and our team will assist you.
                  </p>
                </div>

                <form onSubmit={sendContact} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      id="contact-name"
                      label="Name"
                      required
                      renderInput={
                        <Input
                          id="contact-name"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Ex. John Cruz"
                          required
                          className={inputClass}
                        />
                      }
                    />
                    <FormField
                      id="contact-company"
                      label="Occupation"
                      renderInput={
                        <Input
                          id="contact-company"
                          value={contactCompany}
                          onChange={(e) => setContactCompany(e.target.value)}
                          placeholder="Your occupation"
                          className={inputClass}
                        />
                      }
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      id="contact-email"
                      label="Email"
                      required
                      renderInput={
                        <Input
                          id="contact-email"
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="Your @email.com"
                          required
                          className={inputClass}
                        />
                      }
                    />
                    <FormField
                      id="contact-mobile"
                      label="Mobile Number"
                      required
                      renderInput={
                        <Input
                          id="contact-mobile"
                          value={contactMobile}
                          onChange={(e) => setContactMobile(e.target.value)}
                          placeholder="+639123456789"
                          required
                          className={inputClass}
                        />
                      }
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      id="interest"
                      label="Event Type Interested In"
                      required
                      renderInput={
                        <Select value={interest} onValueChange={setInterest}>
                          <SelectTrigger className={selectClass} aria-required="true">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {interestOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      }
                    />
                  </div>

                  <FormField
                    id="contact-message"
                    label="Your Message"
                    required
                    renderInput={
                      <Textarea
                        id="contact-message"
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Tell us about the event you're interested in or any questions you have..."
                        required
                        className={`${inputClass} min-h-32`}
                      />
                    }
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSending}
                      className="h-12 px-6 text-base font-semibold bg-[#0b4b8f] hover:bg-[#093e77] w-full sm:w-auto"
                    >
                      {isSending ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white border-slate-800 lg:self-start">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold leading-tight">Need Quick Help?</h3>
                  <p className="mt-3 text-sm text-slate-200 leading-relaxed">
                    Prefer to speak with someone directly? Call our support team, and we&apos;ll connect you
                    with a dedicated member of our staff to assist you right away.
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  <a
                    href="mailto:hello@startuplab.ph"
                    className="flex items-center gap-3 font-semibold text-white hover:text-sky-200"
                  >
                    <Mail className="size-5 text-sky-300" />
                    hello@startuplab.ph
                  </a>

                  <a
                    href="tel:639177152587"
                    className="flex items-center gap-3 font-semibold text-white hover:text-sky-200"
                  >
                    <Phone className="size-5 text-sky-300" />
                    63.917.715.2587
                  </a>

                  <div className="flex items-start gap-3 text-slate-100">
                    <MapPin className="size-5 mt-0.5 text-sky-300" />
                    <p className="leading-relaxed">
                      2nd Floor, Pearl Plaza Building, 7001 Felix F. Manalo Rd, General Trias, 4107 Cavite
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-slate-300">
                    <Clock className="size-4 text-sky-300" />
                    Mon - Fri, 9:00 AM - 6:00 PM
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pb-16">
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="relative w-full h-[320px] sm:h-[420px]">
              <iframe
                title="StartupLab location map"
                src={mapsEmbedSrc}
                className="absolute inset-0 h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
              <div className="text-sm text-slate-700">
                <p className="font-semibold text-slate-900">StartupLab Business Center</p>
                <p className="text-slate-600 mt-1">{locationAddress}</p>
              </div>
              <Link
                href={mapsLinkHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900"
              >
                View on Google Maps <ArrowUpRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  renderInput: React.ReactNode;
};

function FormField({ id, label, required, renderInput }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        className="flex items-center gap-1 text-sm font-semibold text-slate-800"
        htmlFor={id}
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {renderInput}
    </div>
  );
}

const inputClass =
  'h-12 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500 rounded-md';

const selectClass =
  'h-12 w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500 justify-between rounded-md px-4';
