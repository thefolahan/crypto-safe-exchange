"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    FaUser,
    FaAt,
    FaVenusMars,
    FaPhone,
    FaGlobe,
    FaLock,
    FaCamera,
    FaTrash,
} from "react-icons/fa";

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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadCountries() {
            try {
                setCountriesLoading(true);
                const res = await fetch("https://restcountries.com/v3.1/all?fields=name");
                const data = await res.json();
                if (cancelled) return;

                const names = (Array.isArray(data) ? data : [])
                    .map((c) => c?.name?.common)
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b));

                setCountries(names);
            } catch (e) {
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

    const canSubmit = useMemo(() => {
        return (
            form.fullName &&
            form.username &&
            form.email &&
            form.gender &&
            form.phoneNumber &&
            form.country &&
            form.password &&
            form.confirmPassword
        );
    }, [form]);

    function onChange(e) {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return alert("Please fill all fields.");
        if (form.password !== form.confirmPassword) return alert("Passwords do not match.");
        if (form.password.length < 8) return alert("Password must be at least 8 characters.");

        try {
            setLoading(true);

            const fd = new FormData();
            fd.append("fullName", form.fullName);
            fd.append("username", form.username);
            fd.append("email", form.email);
            fd.append("gender", form.gender);
            fd.append("phoneNumber", form.phoneNumber);
            fd.append("country", form.country);
            fd.append("password", form.password);
            fd.append("confirmPassword", form.confirmPassword);
            if (profilePicture) fd.append("profilePicture", profilePicture);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                method: "POST",
                body: fd,
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) return alert(data?.message || "Registration failed.");

            alert(data?.message || "Registration started. Check your email.");
            router.push("/login");
        } catch (err) {
            alert("Network error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="relative min-h-screen w-full overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/assets/images/register-background.webp')" }}
            />
            <div className="absolute inset-0 bg-[rgba(6,12,24,0.72)]" />

            <div className="relative z-10 grid min-h-screen place-items-center px-4 py-10 sm:py-14">
                <div className="mx-auto w-full max-w-xl">
                    <div className="rounded-2xl border border-white/10 bg-[rgba(15,26,46,.92)] p-5 shadow-[0_18px_55px_rgba(0,0,0,.55)] sm:p-7">
                        <h1 className="text-center text-2xl font-black tracking-tight text-white sm:text-3xl">
                            Signup
                        </h1>

                        <form onSubmit={onSubmit} className="mt-5 grid gap-3.5">
                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                                    <FaUser />
                                </span>
                                <input
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-white outline-none placeholder:text-white/50 focus:border-white/20"
                                    name="fullName"
                                    placeholder="Full Name"
                                    value={form.fullName}
                                    onChange={onChange}
                                />
                            </div>

                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                                    <FaUser />
                                </span>
                                <input
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-white outline-none placeholder:text-white/50 focus:border-white/20"
                                    name="username"
                                    placeholder="Username"
                                    value={form.username}
                                    onChange={onChange}
                                />
                            </div>

                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                                    <FaAt />
                                </span>
                                <input
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-white outline-none placeholder:text-white/50 focus:border-white/20"
                                    name="email"
                                    placeholder="Email"
                                    value={form.email}
                                    onChange={onChange}
                                />
                            </div>

                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                                    <FaVenusMars />
                                </span>
                                <select
                                    className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pl-11 pr-10 text-white outline-none focus:border-white/20"
                                    name="gender"
                                    value={form.gender}
                                    onChange={onChange}
                                >
                                    <option value="" className="bg-[#0f1a2e]">
                                        Select Gender
                                    </option>
                                    <option value="male" className="bg-[#0f1a2e]">
                                        Male
                                    </option>
                                    <option value="female" className="bg-[#0f1a2e]">
                                        Female
                                    </option>
                                    <option value="other" className="bg-[#0f1a2e]">
                                        Other
                                    </option>
                                </select>

                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/70">
                                    ▾
                                </span>
                            </div>

                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                                    <FaPhone />
                                </span>
                                <input
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-white outline-none placeholder:text-white/50 focus:border-white/20"
                                    name="phoneNumber"
                                    placeholder="Phone Number"
                                    value={form.phoneNumber}
                                    onChange={onChange}
                                />
                            </div>

                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                                    <FaGlobe />
                                </span>
                                <select
                                    className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pl-11 pr-10 text-white outline-none focus:border-white/20 disabled:opacity-70"
                                    name="country"
                                    value={form.country}
                                    onChange={onChange}
                                    disabled={countriesLoading}
                                >
                                    <option value="" className="bg-[#0f1a2e]">
                                        {countriesLoading ? "Loading countries..." : "Select Country"}
                                    </option>
                                    {countries.map((c) => (
                                        <option key={c} value={c} className="bg-[#0f1a2e]">
                                            {c}
                                        </option>
                                    ))}
                                </select>
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/70">
                                    ▾
                                </span>
                            </div>

                            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[rgba(47,107,255,.9)] to-[rgba(32,211,255,.55)]">
                                        {profilePreview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={profilePreview}
                                                alt="Preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <FaCamera className="text-[#061023] opacity-95" />
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="font-black text-white">Profile Picture</div>
                                        <p className="mt-0.5 text-sm text-white/70">
                                            {profilePicture ? (
                                                <>
                                                    Selected:{" "}
                                                    <span className="font-black text-white">{profilePicture.name}</span>
                                                </>
                                            ) : (
                                                "Upload a clear photo (JPG/PNG/WebP)."
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 font-extrabold text-white transition hover:bg-white/15"
                                    >
                                        <FaCamera />
                                        Choose
                                    </button>

                                    {profilePicture && (
                                        <button
                                            type="button"
                                            onClick={() => setProfilePicture(null)}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(255,120,120,.35)] bg-[rgba(255,120,120,.12)] px-4 py-2.5 font-extrabold text-white transition hover:bg-[rgba(255,120,120,.18)]"
                                        >
                                            <FaTrash />
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <input
                                    ref={fileRef}
                                    className="hidden"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                                />
                            </div>

                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                                    <FaLock />
                                </span>
                                <input
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-white outline-none placeholder:text-white/50 focus:border-white/20"
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={form.password}
                                    onChange={onChange}
                                />
                            </div>

                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                                    <FaLock />
                                </span>
                                <input
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pl-11 text-white outline-none placeholder:text-white/50 focus:border-white/20"
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    value={form.confirmPassword}
                                    onChange={onChange}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-1 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[rgba(47,107,255,.95)] to-[rgba(32,211,255,.75)] px-4 py-3.5 font-extrabold text-white transition hover:from-[rgba(47,107,255,1)] hover:to-[rgba(32,211,255,.85)] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? "Creating..." : "Register"}
                            </button>

                            <a
                                href="/login"
                                className="mt-1 text-center font-extrabold text-white/85 hover:text-white hover:underline"
                            >
                                Already have an account? Login
                            </a>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
