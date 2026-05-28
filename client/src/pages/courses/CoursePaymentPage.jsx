import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  buildAuthHeaders,
  coursePriceVnd,
  fetchCourseAccess,
  fetchCurrentUserContact,
} from "../../lib/courseAccess";

const CONTACT_STORAGE_KEY = "course_checkout_contact";

function formatCheckoutVnd(amount) {
  return `${new Intl.NumberFormat("en-US").format(amount)} VND`;
}

function loadSavedContact() {
  try {
    const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 11;
}

function normalizeLocalPhone(value) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length > 9) return digits.slice(2);
  if (digits.startsWith("0") && digits.length > 9) return digits.slice(1);
  return digits;
}

export default function CoursePaymentPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const saved = useMemo(() => loadSavedContact(), []);

  const [accessInfo, setAccessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState(saved?.email || "");
  const [phone, setPhone] = useState(saved?.phone || "");
  const [issueInvoice, setIssueInvoice] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

  const amountVnd = accessInfo ? coursePriceVnd(accessInfo.price) : 0;
  const finalAmountVnd = Math.max(0, amountVnd - appliedDiscount);

  const loadAccess = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchCourseAccess(courseId);
      setAccessInfo(data);
      if (data.hasAccess) {
        navigate(`/courses/${courseId}`, { replace: true });
      }
    } catch (e) {
      setError(e.message || "Could not load course information.");
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => {
    loadAccess();
  }, [loadAccess]);

  useEffect(() => {
    let cancelled = false;

    fetchCurrentUserContact().then((contact) => {
      if (cancelled || !contact) return;
      if (contact.email) setEmail(contact.email);
      if (contact.phone) setPhone(normalizeLocalPhone(contact.phone));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const vnpay = searchParams.get("vnpay");
    if (!vnpay) return;

    if (vnpay === "1") {
      const code = searchParams.get("code");
      const status = searchParams.get("status");
      if (code === "00" && status === "COMPLETED") {
        setMessage("Payment successful! Unlocking your course…");
        loadAccess().then(() => {
          setMessage("Payment successful. You can start learning now.");
          setTimeout(() => navigate(`/courses/${courseId}`, { replace: true }), 1500);
        });
      } else {
        setMessage("Payment was not completed or was declined.");
      }
    } else if (vnpay === "checksum") {
      setMessage("Invalid VNPay response (checksum).");
    } else if (vnpay === "error") {
      const reason = searchParams.get("reason");
      setMessage(
        reason ? `Payment error: ${decodeURIComponent(reason)}` : "Something went wrong processing payment.",
      );
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, loadAccess, navigate, courseId]);

  const validateForm = () => {
    const next = {};
    if (!isValidEmail(email)) next.email = "Please enter a valid email address.";
    if (!isValidPhone(phone)) next.phone = "Please enter a valid phone number.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const persistContact = () => {
    localStorage.setItem(
      CONTACT_STORAGE_KEY,
      JSON.stringify({ email: email.trim(), phone: phone.trim() }),
    );
  };

  const applyCoupon = () => {
    setCouponMessage(null);
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage("Please enter a coupon code.");
      return;
    }
    setAppliedDiscount(0);
    setCouponMessage("Coupon codes are not supported in this test version.");
  };

  const startCheckout = async () => {
    if (!accessInfo || accessInfo.isFree) {
      navigate(`/courses/${courseId}`);
      return;
    }
    if (!validateForm()) return;

    persistContact();
    setCheckoutLoading(true);
    setMessage(null);
    setError(null);

    const orderInfo = `Course purchase ${accessInfo.title || courseId}`.slice(0, 240);

    try {
      const res = await fetch("/api/payments/vnpay/create", {
        method: "POST",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          amountVnd: finalAmountVnd,
          orderInfo,
          courseId,
          bankCode: "NCB",
          planCode: null,
          billingCycle: null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.message || data.error || `HTTP ${res.status}`;
        if (res.status === 401) {
          throw new Error(
            "Not authenticated. Set PAYMENT_TEST_USER_ID in .env and restart api-gateway, or send a Bearer token.",
          );
        }
        throw new Error(typeof msg === "string" ? msg : "Could not create payment link");
      }
      if (!data.paymentUrl) {
        throw new Error("Missing paymentUrl in response");
      }
      window.location.href = data.paymentUrl;
    } catch (e) {
      setError(e.message || "Could not start VNPay checkout.");
      setCheckoutLoading(false);
    }
  };

  const courseTitle = loading ? "Loading…" : accessInfo?.title || "Course";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--background)] to-[var(--secondary)] py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {(error || message) && (
          <div className="mb-6 space-y-3">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent)] px-4 py-3 text-sm text-[var(--accent-foreground)]">
                {message}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <h1 className="text-center text-xl font-[var(--font-serif)] text-[var(--primary)] sm:text-2xl">
              Your Information
            </h1>

            <div className="mt-6 flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--accent)] px-4 py-3 text-sm text-[var(--foreground)]">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-amber)]" />
              <p>
                This course and all included benefits will be added to your account after payment
                is completed successfully.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="checkout-email" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Email <span className="text-[var(--destructive)]">(*)</span>
                </label>
                <Input
                  id="checkout-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  placeholder="email@example.com"
                  className="rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-4 py-3"
                  disabled={loading || checkoutLoading}
                />
                {fieldErrors.email ? (
                  <p className="mt-1.5 text-xs text-[var(--destructive)]">{fieldErrors.email}</p>
                ) : (
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
                    Email is required to receive your receipt, activate the course, and get updates.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="checkout-phone" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Phone number <span className="text-[var(--destructive)]">(*)</span>
                </label>
                <div className="flex overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
                  <div className="flex items-center gap-2 border-r border-[var(--border)] bg-[var(--secondary)] px-3 text-sm text-[var(--foreground)]">
                    <span aria-hidden>🇻🇳</span>
                    <span className="font-medium">+84</span>
                  </div>
                  <input
                    id="checkout-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined }));
                    }}
                    placeholder="965208556"
                    disabled={loading || checkoutLoading}
                    className="w-full px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1.5 text-xs text-[var(--destructive)]">{fieldErrors.phone}</p>
                )}
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={issueInvoice}
                  onChange={(e) => setIssueInvoice(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent-amber)] focus:ring-[var(--ring)]"
                  disabled={loading || checkoutLoading}
                />
                Issue invoice
              </label>
            </div>

            <p className="mt-8 text-center text-xs leading-relaxed text-[var(--muted-foreground)]">
              By clicking &quot;Continue to payment&quot;, I agree to the{" "}
              <a href="/" className="text-[var(--accent-amber-dark)] hover:underline">
                Terms &amp; Conditions
              </a>{" "}
              and{" "}
              <a href="/" className="text-[var(--accent-amber-dark)] hover:underline">
                Privacy Policy
              </a>{" "}
              of Abroad Consultancy.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/courses")}
                disabled={checkoutLoading}
              >
                Back to courses
              </Button>
              <Button
                type="button"
                variant="gradient"
                className="flex-[1.4] text-base font-semibold"
                disabled={loading || checkoutLoading || accessInfo?.isFree}
                onClick={startCheckout}
              >
                {checkoutLoading ? "Redirecting to VNPay…" : "Continue to payment"}
                {!checkoutLoading && <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <h2 className="text-center text-xl font-[var(--font-serif)] text-[var(--primary)] sm:text-2xl">
              Order summary
            </h2>

            <div className="mt-8">
              <p className="text-sm font-semibold text-[var(--foreground)]">Product:</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-amber)]" />
                  <span>{courseTitle}</span>
                </div>
                <span className="shrink-0 text-sm font-medium text-[var(--foreground)]">
                  {loading ? "…" : accessInfo?.isFree ? "Free" : formatCheckoutVnd(amountVnd)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-dashed border-[var(--border)] pt-5">
              <span className="text-sm font-semibold text-[var(--foreground)]">Subtotal:</span>
              <span className="text-sm font-bold text-[var(--foreground)]">
                {loading ? "…" : accessInfo?.isFree ? "Free" : formatCheckoutVnd(amountVnd)}
              </span>
            </div>

            <div className="mt-6 rounded-2xl bg-[var(--secondary)] p-4">
              <label
                htmlFor="checkout-coupon"
                className="mb-2 block text-sm font-semibold text-[var(--foreground)]"
              >
                Coupon code
              </label>
              <div className="flex overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <input
                  id="checkout-coupon"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 px-4 py-2.5 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--ring)]"
                  disabled={loading || checkoutLoading}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="border-l border-[var(--border)] bg-[var(--secondary)] px-4 text-sm font-semibold text-[var(--accent-amber-dark)] hover:bg-[var(--accent)] disabled:opacity-50"
                  disabled={loading || checkoutLoading}
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <p className="mt-2 text-xs text-[var(--accent-foreground)]">{couponMessage}</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--foreground)]">Total due</span>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-amber)] to-[var(--accent-coral)]">
                {loading ? "…" : accessInfo?.isFree ? "Free" : formatCheckoutVnd(finalAmountVnd)}
              </span>
            </div>

            <p className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
              Still have questions?{" "}
              <a href="/advisor" className="font-medium text-[var(--accent-amber-dark)] hover:underline">
                Contact an advisor →
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
