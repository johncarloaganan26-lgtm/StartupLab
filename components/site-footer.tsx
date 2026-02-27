'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer id="footer" className="relative overflow-hidden bg-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-100/90 to-slate-100/60" />
        <div className="absolute -right-28 top-1/2 -translate-y-1/2 opacity-10 blur-[0.25px] mix-blend-multiply">
          <Image
            src="/Dark-e1735336357773.png"
            alt=""
            width={900}
            height={273}
            className="h-auto w-[900px]"
            priority={false}
          />
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="mb-5">
              <Image
                src="/Dark-e1735336357773.png"
                alt="Startup Lab"
                width={320}
                height={97}
                className="h-12 w-auto"
              />
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600">
              Empowering the next generation of entrepreneurs through workshops, mentorship, networking, and pitch events.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900/80">
              Office Hours
            </h4>
            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 text-sky-600" />
                <div>
                  <p className="font-semibold text-slate-900">Mon-Fri</p>
                  <p className="text-slate-600">9:00 AM - 6:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-sky-600" />
                <div>
                  <p className="font-semibold text-slate-900">Visit Us</p>
                  <p className="text-slate-600">
                    2nd Floor, Pearl Plaza Building,
                    <br />
                    General Trias, Cavite 4107
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-900/80">
              Connect With Us
            </h4>
            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <a
                href="mailto:hello@startuplab.com"
                className="flex items-start gap-3 hover:text-slate-900"
              >
                <Mail className="mt-0.5 size-4 text-sky-600" />
                <div>
                  <p className="font-semibold text-slate-900">Email</p>
                  <p className="text-slate-600">hello@startuplab.com</p>
                </div>
              </a>

              <a
                href="tel:+639000000000"
                className="flex items-start gap-3 hover:text-slate-900"
              >
                <Phone className="mt-0.5 size-4 text-sky-600" />
                <div>
                  <p className="font-semibold text-slate-900">Phone</p>
                  <p className="text-slate-600">+63 900 000 0000</p>
                </div>
              </a>

              <Link href="/contact" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700">
                Contact page
                <span aria-hidden className="text-slate-500">-&gt;</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            (c) 2025 Startup Lab. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs">
            <Link href="/events" className="text-slate-500 hover:text-slate-900">Events</Link>
            <Link href="/contact" className="text-slate-500 hover:text-slate-900">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
