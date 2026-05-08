import { motion } from "framer-motion";
import { CreditCard, Shield, Check, Download, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

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

const transactions = [
  { id: 1, date: "2026-03-09", description: "Professional Plan - Monthly", amount: 79, status: "completed" },
  { id: 2, date: "2026-02-09", description: "Professional Plan - Monthly", amount: 79, status: "completed" },
  { id: 3, date: "2026-01-09", description: "Basic Plan - Monthly", amount: 29, status: "completed" },
];

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [billingCycle, setBillingCycle] = useState("monthly");

  const currentPlan = plans.find((plan) => plan.id === "pro");

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
                    <CheckCircle2 className="w-3 h-3" />
                    Active Subscription
                  </Badge>
                  <h2 className="text-3xl font-[var(--font-serif)] mb-2">{currentPlan?.name}</h2>
                  <p className="text-white/80">Unlimited access to all professional features</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">${currentPlan?.price}</div>
                  <div className="text-sm text-white/70">per month</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-white/20">
                <div>
                  <div className="text-sm text-white/70 mb-1">Next billing date</div>
                  <div className="font-medium">May 9, 2026</div>
                </div>
                <div>
                  <div className="text-sm text-white/70 mb-1">Payment method</div>
                  <div className="font-medium">•••• •••• •••• 4242</div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button className="bg-white text-[var(--primary)] hover:bg-white/90">Manage Plan</Button>
                <Button className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20">
                  Cancel Subscription
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
                  const price = billingCycle === "annual" ? Math.round(plan.price * 0.8 * 12) : plan.price;

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
                        <span className="text-4xl font-bold text-[var(--foreground)]">${price}</span>
                        <span className="text-[var(--muted-foreground)]">
                          /{billingCycle === "annual" ? "year" : "month"}
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
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        {selectedPlan === plan.id
                          ? "Current Plan"
                          : plan.id === "pro"
                            ? "Current Plan"
                            : "Select Plan"}
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
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">
                            ${transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge className="rounded-full bg-green-100 text-green-700 border-transparent">
                              <CheckCircle2 className="w-3 h-3" />
                              {transaction.status}
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
                      ))}
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
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-[var(--shadow-md)] border border-[var(--border)]"
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--accent-amber)]" />
                Payment Method
              </h3>
              <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--accent-violet)] rounded-xl p-4 text-white mb-4">
                <div className="flex justify-between items-start mb-8">
                  <div className="text-xs opacity-70">Credit Card</div>
                  <CreditCard className="w-8 h-8 opacity-50" />
                </div>
                <div className="font-mono text-lg mb-2">•••• •••• •••• 4242</div>
                <div className="flex justify-between items-center text-xs">
                  <span>John Doe</span>
                  <span>12/28</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Update Payment Method
              </Button>
            </motion.div>

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

