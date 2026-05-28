import { getLocalAccessToken } from "@/services/apiClient";
import { decodeJwtPayload, normalizeAccessToken } from "@/utils/jwt";

const USD_VND_RATE = 25000;

export function coursePriceVnd(priceUsd) {
  const n = Number(priceUsd);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * USD_VND_RATE);
}

export function formatMoneyVnd(amount) {
  return new Intl.NumberFormat("en-US").format(amount) + " VND";
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return normalizeAccessToken(getLocalAccessToken());
}

/** @returns {Promise<{ email?: string, phone?: string } | null>} */
export async function fetchCurrentUserContact() {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch("/api/auth/users/me", { headers: buildAuthHeaders() });
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      const profile = data.userProfile || data.profile;
      return {
        email: data.email || "",
        phone: profile?.phone || "",
      };
    }
  } catch {
    /* fallback JWT */
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.email) return null;
  return { email: payload.email, phone: "" };
}

export function buildAuthHeaders(extra = {}) {
  const token = getAccessToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchCourseAccess(courseId) {
  try {
    const res = await fetch(`/api/v1/courses/${courseId}/access`, {
      headers: buildAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || json;
    }
  } catch (err) {
    console.warn("Local course access check failed, falling back to payment-service:", err);
  }

  const res = await fetch(`/api/payments/courses/${courseId}/access`, {
    headers: buildAuthHeaders(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data || json;
}

/**
 * Điều hướng khi user mở khóa học.
 * @returns {'opened' | 'payment'}
 */
export async function openCourseWithPaymentGate(courseId, navigate) {
  try {
    const access = await fetchCourseAccess(courseId);
    if (access.hasAccess) {
      navigate(`/courses/${courseId}`);
      return "opened";
    }
    navigate(`/courses/${courseId}/payment`);
    return "payment";
  } catch {
    navigate(`/courses/${courseId}/payment`);
    return "payment";
  }
}
