"use client";

import { useActionState } from "react";
import { updateCategoryPromotion, ActionResponse } from "@/app/actions/promotions";

interface PromotionFormProps {
  categoryId: number;
  categoryName: string;
  initialData?: {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    targetUrl?: string;
    isActive?: boolean;
  };
}

const initialState: ActionResponse = {
  success: false,
  message: "",
};

export default function PromotionForm({
  categoryId,
  categoryName,
  initialData,
}: PromotionFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateCategoryPromotion,
    initialState
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4 rounded-lg border p-6 bg-white shadow-sm">
      <h3 className="text-lg font-bold">Featured Banner: {categoryName}</h3>

      {/* Hidden Category ID */}
      <input type="hidden" name="categoryId" value={categoryId} />

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Banner Title</label>
        <input
          type="text"
          name="title"
          defaultValue={initialData?.title ?? ""}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-black focus:outline-none"
        />
        {state.errors?.title && (
          <p className="mt-1 text-xs text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Subtitle / Price Note</label>
        <input
          type="text"
          name="subtitle"
          defaultValue={initialData?.subtitle ?? ""}
          placeholder="e.g., From KSh 4,500 with Express Delivery"
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-black focus:outline-none"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          type="url"
          name="imageUrl"
          defaultValue={initialData?.imageUrl ?? ""}
          required
          placeholder="https://images.unsplash.com/..."
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-black focus:outline-none"
        />
        {state.errors?.imageUrl && (
          <p className="mt-1 text-xs text-red-600">{state.errors.imageUrl[0]}</p>
        )}
      </div>

      {/* Target URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Destination Link</label>
        <input
          type="text"
          name="targetUrl"
          defaultValue={initialData?.targetUrl ?? ""}
          placeholder="/shop/deals/earbuds"
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-black focus:outline-none"
        />
      </div>

      {/* Active Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          id="isActive"
          defaultChecked={initialData?.isActive ?? true}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Display in Navigation Menu
        </label>
      </div>

      {/* Status Feedback */}
      {state.message && (
        <p className={`text-sm ${state.success ? "text-green-600" : "text-red-600"}`}>
          {state.message}
        </p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? "Saving & Purging Cache..." : "Save Promotion"}
      </button>
    </form>
  );
}
