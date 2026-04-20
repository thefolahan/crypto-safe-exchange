"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCheck, FaCopy, FaEye, FaEyeSlash } from "react-icons/fa";
import { buildApiUrl } from "../lib/apiUrl";

export default function RegisterPage() {
    const router = useRouter();
    const fileRef = useRef(null);

    const [countries, setCountries] = useState([]);
    const [countriesLoading, setCountriesLoading] = useState(true);

    const [form, setForm] = useState({
        fullName: "",
        username: "",
        email: "",
        gender: "",
        phoneNumber: "",
        country: "",
        password: "",
        confirmPassword: "",
    });

    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePreview, setProfilePreview] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [secretPhrase, setSecretPhrase] = useState("");
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadCountries() {
            try {
                const response = await fetch("https://restcountries.com/v3.1/all?fields=name");
                const payload = await response.json();
                if (cancelled) return;

                const names = (Array.isArray(payload) ? payload : [])
                    .map((item) => item?.name?.common)
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b));

                setCountries(names);
            } catch {
                setCountries([]);
            } finally {
                if (!cancelled) setCountriesLoading(false);
            }
        }

        loadCountries();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!profilePicture) {
            setProfilePreview("");
            return;
        }

        const url = URL.createObjectURL(profilePicture);
        setProfilePreview(url);

        return () => URL.revokeObjectURL(url);
    }, [profilePicture]);

    const canSubmit = useMemo(() => Object.values(form).every(Boolean), [form]);
    const secretWords = useMemo(() => secretPhrase.split(" ").filter(Boolean), [secretPhrase]);

    function onChange(event) {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function onSubmit(event) {
        event.preventDefault();

        if (!canSubmit) return alert("Please fill all fields.");
        if (form.password.length < 8) return alert("Password must be at least 8 characters.");
        if (form.password !== form.confirmPassword) return alert("Passwords do not match.");

        try {
            setLoading(true);

            const data = new FormData();
            data.append("fullName", form.fullName);
            data.append("username", form.username);
            data.append("email", form.email);
            data.append("gender", form.gender);
            data.append("phoneNumber", form.phoneNumber);
            data.append("country", form.country);
            data.append("password", form.password);
            data.append("confirmPassword", form.confirmPassword);
            if (profilePicture) data.append("profilePicture", profilePicture);

            const response = await fetch(buildApiUrl("/api/auth/register"), {
                method: "POST",
                body: data,
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) return alert(payload?.message || "Registration failed.");

            const newSecretPhrase = String(payload?.secretPhrase || "").trim();
            if (!newSecretPhrase) {
                alert("Registration succeeded but secret phrase was not returned.");
                return;
            }

            setSecretPhrase(newSecretPhrase);
            setCopied(false);
        } catch {
            alert("Network error");
        } finally {
            setLoading(false);
        }
    }

    async function onCopySecretPhrase() {
        if (!secretPhrase) return;

        try {
            await navigator.clipboard.writeText(secretPhrase);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            alert("Could not copy. Please copy it manually.");
        }
    }

    const fieldClass = "input border-[#303745] bg-[#0c1016]";

    return (
        <main className="relative min-h-screen overflow-y-auto px-4 py-8 sm:py-10">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/assets/images/register-background.webp')" }}
            />
            <div className="absolute inset-0 bg-[rgba(4,6,10,.74)]" />

            <div className="relative z-10 grid min-h-[calc(100vh-4rem)] place-items-center sm:min-h-[calc(100vh-5rem)]">
                <div className="mx-auto w-full max-w-xl">
                    <a href="/" className="mx-auto mb-6 flex w-fit items-center text-sm text-[var(--gold)]">
                        <img src="/assets/svgs/logo.svg?v=btc-shield-1" alt="Logo" className="h-12 w-12" />
                    </a>

                    <div className="site-card bg-[#0f1218] p-5 sm:p-6">
                        <h1 className="text-3xl font-semibold text-[#f3f4f6]">Create account</h1>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                            {secretPhrase
                                ? "Save this phrase now. You can use it to sign in."
                                : "Set up your profile and start trading."}
                        </p>

                        {secretPhrase ? (
                            <section className="mt-5 rounded-xl border border-[#2d3442] bg-[#121722] p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#f3f4f6]">Your Secret Phrase</h2>
                                        <p className="mt-1 text-xs text-[var(--muted)]">
                                            Keep it private. This phrase can sign in to your account.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={onCopySecretPhrase}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#323a4a] text-[var(--gold)] transition hover:bg-white/[0.06]"
                                        aria-label="Copy secret phrase"
                                        title="Copy secret phrase"
                                    >
                                        {copied ? <FaCheck /> : <FaCopy />}
                                    </button>
                                </div>

                                <ol className="mt-4 grid gap-2 rounded-xl border border-[#2c3240] bg-[#0f131d] p-3 text-sm text-[#e8ecf2] sm:grid-cols-2">
                                    {secretWords.map((word, index) => (
                                        <li key={`${word}-${index}`} className="rounded-md bg-white/[0.03] px-3 py-2">
                                            <span className="mr-2 text-[var(--gold)]">{index + 1}.</span>
                                            {word}
                                        </li>
                                    ))}
                                </ol>

                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    <button type="button" onClick={onCopySecretPhrase} className="btn-dark justify-center">
                                        {copied ? "Copied" : "Copy phrase"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push("/login")}
                                        className="btn-gold justify-center"
                                    >
                                        Continue to Sign in
                                    </button>
                                </div>
                            </section>
                        ) : (
                            <form onSubmit={onSubmit} className="mt-5 grid gap-3">
                                <label>
                                    <span className="mb-1.5 block text-xs text-[var(--muted)]">Full name</span>
                                    <input name="fullName" value={form.fullName} onChange={onChange} className={fieldClass} />
                                </label>

                                <label>
                                    <span className="mb-1.5 block text-xs text-[var(--muted)]">Username</span>
                                    <input name="username" value={form.username} onChange={onChange} className={fieldClass} />
                                </label>

                                <label>
                                    <span className="mb-1.5 block text-xs text-[var(--muted)]">Email</span>
                                    <input
                                        name="email"
                                        value={form.email}
                                        onChange={onChange}
                                        className={fieldClass}
                                    />
                                </label>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label>
                                        <span className="mb-1.5 block text-xs text-[var(--muted)]">Gender</span>
                                        <select name="gender" value={form.gender} onChange={onChange} className={fieldClass}>
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </label>

                                    <label>
                                        <span className="mb-1.5 block text-xs text-[var(--muted)]">Phone number</span>
                                        <input name="phoneNumber" value={form.phoneNumber} onChange={onChange} className={fieldClass} />
                                    </label>
                                </div>

                                <label>
                                    <span className="mb-1.5 block text-xs text-[var(--muted)]">Country</span>
                                    <select
                                        name="country"
                                        value={form.country}
                                        onChange={onChange}
                                        className={fieldClass}
                                        disabled={countriesLoading}
                                    >
                                        <option value="">
                                            {countriesLoading ? "Loading countries..." : "Select country"}
                                        </option>
                                        {countries.map((country) => (
                                            <option key={country} value={country}>
                                                {country}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <div className="site-card rounded-xl bg-[#12161d] p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 overflow-hidden rounded-lg border border-[#2a303a] bg-[#0f1218]">
                                                {profilePreview ? (
                                                    <img src={profilePreview} alt="Preview" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="grid h-full w-full place-items-center text-xs text-[var(--muted)]">
                                                        IMG
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-[var(--muted)]">
                                                {profilePicture ? profilePicture.name : "Optional profile picture"}
                                            </div>
                                        </div>

                                        <button type="button" onClick={() => fileRef.current?.click()} className="btn-dark text-xs">
                                            Upload
                                        </button>
                                    </div>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                                    />
                                </div>

                                <label>
                                    <span className="mb-1.5 block text-xs text-[var(--muted)]">Password</span>
                                    <span className="relative block">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={form.password}
                                            onChange={onChange}
                                            className={`${fieldClass} pr-12`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </span>
                                </label>

                                <label>
                                    <span className="mb-1.5 block text-xs text-[var(--muted)]">Confirm password</span>
                                    <span className="relative block">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={form.confirmPassword}
                                            onChange={onChange}
                                            className={`${fieldClass} pr-12`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]"
                                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                        >
                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </span>
                                </label>

                                <button type="submit" disabled={loading} className="btn-gold mt-1 w-full justify-center">
                                    {loading ? "Creating account..." : "Create account"}
                                </button>

                                <a href="/login" className="text-center text-sm text-[var(--muted)] hover:text-[#eef1f6]">
                                    Already registered? <span className="text-[var(--gold)]">Sign in</span>
                                </a>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
