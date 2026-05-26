import { motion } from "framer-motion";
import { Shield, Check, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { buildAuthHeaders } from "../lib/courseAccess";

/** Internal USD list price × rate → VND for VNPay (replace with live FX if needed). */
const USD_VND_RATE = 25000;

const PLAN_ORDER = { basic: 0, pro: 1, premium: 2 };

const plans = [
  {
    id: "basic",
    name: "Basic Plan",
    price: 29,
    period: "month",
    features: [
      "University search & recommendations",
      "Basic application tracking",
      "Email support",
      "Community access",
    ],
  },
  {
    id: "pro",
    name: "Professional Plan",
    price: 79,
    period: "month",
    features: [
      "Everything in Basic",
      "AI-powered personalized guidance",
      "Unlimited advisor chat",
      "Document review & feedback",
      "Exam preparation resources",
      "Priority email & chat support",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium Plan",
    price: 149,
    period: "month",
    features: [
      "Everything in Professional",
      "1-on-1 expert consultations",
      "Visa application assistance",
      "Interview preparation",
      "Scholarship matching",
      "24/7 priority support",
      "Success guarantee",
    ],
  },
];

function planAmountVnd(plan, billingCycle) {
  const usd = billingCycle === "annual" ? Math.round(plan.price * 0.8 * 12) : plan.price;
  return Math.round(usd * USD_VND_RATE);
}

function formatMoneyVnd(n) {
  return new Intl.NumberFormat("en-US").format(n) + " VND";
}

function formatPaymentAmount(payment) {
  const n = Number(payment.amount);
  if ((payment.currency || "").toUpperCase() === "VND") {
    return formatMoneyVnd(n);
  }
  return `$${n.toFixed(2)}`;
}

export default function PaymentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [now, setNow] = useState(() => Date.now());
  const [checkoutPlanId, setCheckoutPlanId] = useState(null);
  const [vnpayMessage, setVnpayMessage] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const subscribedPlanId = subscription?.planCode || "basic";
  const subscribedBillingCycle = subscription?.billingCycle === "annual" ? "annual" : "monthly";
  const expiresMs = subscription?.expiresAt != null ? new Date(subscription.expiresAt).getTime() : 0;
  const isExpired = subscription && expiresMs < now;

  const subscribedPlan = useMemo(
    () => plans.find((p) => p.id === subscribedPlanId),
    [subscribedPlanId],
  );

  const loadFromApi = useCallback(async () => {
    setApiError(null);
    setSubscriptionLoading(true);

    const headers = buildAuthHeaders();

    try {
      const [subRes, payRes] = await Promise.all([
        fetch("/api/payments/subscription/me", { headers }),
        fetch("/api/payments", { headers }),
      ]);

      if (subRes.status === 401 || subRes.status === 403) {
        setSubscription(null);
        setApiError(
          "Invalid or expired token (401/403). Ensure API gateway JWT_PUBLIC_KEY matches the auth-service signing key.",
        );
        setTransactions([]);
        return;
      }

      if (!subRes.ok) {
        const errText = await subRes.text();
        throw new Error(errText || `subscription/me ${subRes.status}`);
      }

      const subJson = await subRes.json();
      setSubscription({
        userId: subJson.userId,
        planCode: subJson.planCode,
        billingCycle: subJson.billingCycle,
        expiresAt: subJson.expiresAt,
      });

      if (payRes.ok) {
        const list = await payRes.json();
        setTransactions(Array.isArray(list) ? list : []);
      } else {
        setTransactions([]);
      }
    } catch (e) {
      setApiError(e.message || "Could not load subscription from payment service.");
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const vnpay = searchParams.get("vnpay");
    if (!vnpay) return;

    if (vnpay === "1") {
      const code = searchParams.get("code");
      const status = searchParams.get("status");
      if (code === "00" && status === "COMPLETED") {
        setVnpayMessage("Payment successful. Syncing subscription…");
        loadFromApi().then(() => {
          setVnpayMessage("Payment successful. Your plan has been updated.");
        });
      } else {
        setVnpayMessage("Payment was not completed or was declined.");
      }
    } else if (vnpay === "checksum") {
      setVnpayMessage("Invalid VNPay response (checksum).");
    } else if (vnpay === "error") {
      const reason = searchParams.get("reason");
      setVnpayMessage(
        reason ? `Payment error: ${decodeURIComponent(reason)}` : "Something went wrong processing payment.",
      );
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, loadFromApi]);

  const planButtonLabel = (planId) => {
    if (!token) return "Select plan";
    if (!subscription) return "…";
    if (isExpired) return "Select plan";
    if (planId === subscribedPlanId) return "Current plan";
    if (PLAN_ORDER[planId] > PLAN_ORDER[subscribedPlanId]) return "Upgrade";
    return "Select plan";
  };

  const isPlanButtonDisabled = (planId) => {
    if (checkoutPlanId) return true;
    if (!token) return false;
    if (subscriptionLoading || !subscription) return true;
    return !isExpired && planId === subscribedPlanId;
  };

  const handlePlanClick = (planId) => {
    startVnpayCheckout(planId);
  };

  const startVnpayCheckout = async (planId) => {

    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const amountVnd = planAmountVnd(plan, billingCycle);
    const orderInfo = `Abroad ${plan.name} ${billingCycle === "annual" ? "annual" : "monthly"}`.slice(0, 240);

    setCheckoutPlanId(planId);
    setVnpayMessage(null);

    try {
      const res = await fetch("/api/payments/vnpay/create", {
        method: "POST",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          amountVnd,
          orderInfo,
          courseId: null,
          bankCode: "NCB",
          planCode: planId,
          billingCycle,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.message || data.error || `HTTP ${res.status}`;
        throw new Error(typeof msg === "string" ? msg : "Could not create payment link");
      }

      const url = data.paymentUrl;
      if (!url) {
        throw new Error("Missing paymentUrl in response");
      }

      window.location.href = url;
    } catch (e) {
      setVnpayMessage(e.message || "Could not start VNPay checkout.");
      setCheckoutPlanId(null);
    }
  };

  const displayPriceHeroVnd =
    subscription && subscribedPlan ? planAmountVnd(subscribedPlan, subscribedBillingCycle) : 0;
  const heroLabel = subscribedBillingCycle === "annual" ? "per year" : "per month";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--background)] to-[var(--secondary)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-[var(--font-serif)] text-[var(--primary)] mb-3">
            Billing & Payments
          </h1>
          <p className="text-lg text-[var(--muted-foreground)]">
            Manage your subscription and payment methods
          </p>
        </motion.div>

        {apiError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 text-red-900 px-4 py-3 text-sm">
            {apiError}
          </div>
        )}

        {subscriptionLoading && !apiError && token && (
          <p className="text-center text-sm text-[var(--muted-foreground)] mb-4">Loading subscription…</p>
        )}

        {isExpired && subscription && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">Subscription expired</p>
              <p className="text-sm text-amber-800/90 dark:text-amber-200/90">
                Your {subscribedBillingCycle === "annual" ? "annual" : "monthly"} period has ended. Select a plan and
                pay again via VNPay.
              </p>
            </div>
          </div>
        )}

        {vnpayMessage && (
          <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm text-[var(--foreground)]">
            {vnpayMessage}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] rounded-3xl p-8 text-white shadow-[var(--shadow-2xl)]"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <Badge className="rounded-full bg-white/20 backdrop-blur-sm border-transparent mb-3">
                    {!subscription ? (
                      <>…</>
                    ) : isExpired ? (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        Expired
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Active Subscription
                      </>
                    )}
                  </Badge>
                  <h2 className="text-3xl font-[var(--font-serif)] mb-2">
                    {!subscription ? "—" : isExpired ? "No active plan" : subscribedPlan?.name}
                  </h2>
                  <p className="text-white/80">
                    {!subscription
                      ? "Loading subscription from payment-service…"
                      : isExpired
                        ? "Pay for a new plan to reactivate."
                        : "Unlimited access to all professional features"}
                  </p>
                </div>
                {subscription && !isExpired && subscribedPlan && (
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-bold leading-tight">
                      {formatMoneyVnd(displayPriceHeroVnd)}
                    </div>
                    <div className="text-sm text-white/70">{heroLabel}</div>
                  </div>
                )}
              </div>

              {subscription && (
                <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-white/20">
                  <div>
                    <div className="text-sm text-white/70 mb-1">
                      {isExpired ? "Expired on" : "Renews / ends on"}
                    </div>
                    <div className="font-medium">
                      {new Date(subscription.expiresAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                  {!isExpired && (
                    <div>
                      <div className="text-sm text-white/70 mb-1">Billing cycle</div>
                      <div className="font-medium">
                        {subscribedBillingCycle === "annual" ? "Annual" : "Monthly"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isExpired && subscription && (
                <p className="text-sm text-white/80 mt-4">
                  Monthly and annual use different prices: choose below, then pay — the VNPay amount and renewal period
                  (30 / 365 days) match your selection.
                </p>
              )}

              <div className="flex gap-3 mt-6 flex-wrap">
                <Button
                  className="bg-white text-[var(--primary)] hover:bg-white/90"
                  disabled={!subscription || isExpired}
                  type="button"
                >
                  Manage Plan
                </Button>
                <Button
                  className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
                  disabled={!subscription || isExpired}
                  type="button"
                >
                  Cancel Subscription
                </Button>
                <Button
                  variant="outline"
                  className="border-white/40 text-white bg-transparent hover:bg-white/10"
                  type="button"
                  onClick={() => setNow(Date.now())}
                >
                  Refresh status
                </Button>
              </div>
            </motion.div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-[var(--foreground)]">Available Plans</h2>
                <div className="flex items-center gap-2 p-1 bg-[var(--secondary)] rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBillingCycle("monthly")}
                    className={
                      billingCycle === "monthly"
                        ? "bg-white text-[var(--foreground)] shadow-sm"
                        : "text-[var(--muted-foreground)]"
                    }
                  >
                    Monthly
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBillingCycle("annual")}
                    className={
                      billingCycle === "annual"
                        ? "bg-white text-[var(--foreground)] shadow-sm"
                        : "text-[var(--muted-foreground)]"
                    }
                  >
                    Annual
                    <span className="ml-1 text-xs text-[var(--accent-amber)]">Save 20%</span>
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan, index) => {
                  const vnd = planAmountVnd(plan, billingCycle);

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative bg-white rounded-2xl p-6 border-2 transition-all ${
                        plan.popular
                          ? "border-[var(--accent-amber)] shadow-[var(--shadow-xl)]"
                          : "border-[var(--border)] hover:border-[var(--accent-amber)]/50"
                      }`}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[var(--accent-amber)] to-[var(--accent-coral)] text-white border-transparent rounded-full">
                          Most Popular
                        </Badge>
                      )}

                      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-[var(--foreground)]">
                          {formatMoneyVnd(vnd)}
                        </span>
                        <span className="text-[var(--muted-foreground)] text-sm">
                          {billingCycle === "annual" ? " / year" : " / month"}
                        </span>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-[var(--accent-amber)] mt-0.5 flex-shrink-0" />
                            <span className="text-[var(--muted-foreground)]">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant={plan.popular ? "gradient" : "secondary"}
                        className="w-full"
                        disabled={isPlanButtonDisabled(plan.id)}
                        onClick={() => handlePlanClick(plan.id)}
                      >
                        {checkoutPlanId === plan.id ? "Redirecting to VNPay…" : planButtonLabel(plan.id)}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-6">Transaction History</h2>
              <div className="bg-white rounded-2xl shadow-[var(--shadow-md)] overflow-hidden border border-[var(--border)]">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--secondary)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[var(--muted-foreground)]">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[var(--muted-foreground)]">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[var(--muted-foreground)]">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[var(--muted-foreground)]">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[var(--muted-foreground)]">
                          Invoice
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {transactions.length === 0 ? (
                        <tr>
                          <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]" colSpan={5}>
                            No transactions yet.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction) => {
                          const st = (transaction.status || "").toLowerCase();
                          const ok = st === "completed";
                          return (
                            <tr key={transaction.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                              <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                                {new Date(transaction.createdAt || transaction.updatedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                                {transaction.description || "—"}
                                {transaction.planCode ? (
                                  <span className="block text-xs text-[var(--muted-foreground)]">
                                    {transaction.planCode}
                                    {transaction.billingCycle ? ` · ${transaction.billingCycle}` : ""}
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">
                                {formatPaymentAmount(transaction)}
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  className={
                                    ok
                                      ? "rounded-full bg-green-100 text-green-700 border-transparent"
                                      : "rounded-full bg-zinc-100 text-zinc-700 border-transparent"
                                  }
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  {st}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-[var(--accent-amber)] hover:text-[var(--accent-amber-dark)]"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-[var(--shadow-md)] border border-[var(--border)]"
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--accent-amber)]" />
                Security & Trust
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-[var(--muted-foreground)]">256-bit SSL encryption</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-[var(--muted-foreground)]">PCI DSS compliant</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-[var(--muted-foreground)]">30-day money-back guarantee</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <span className="text-[var(--muted-foreground)]">Cancel anytime</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-[var(--accent-amber)]/10 to-[var(--accent-coral)]/10 rounded-2xl p-6 border border-[var(--accent-amber)]/20"
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Need help?</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Our billing support team is here to assist you with any questions.
              </p>
              <Button variant="gradient" size="sm" className="w-full">
                Contact Support
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
