import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, waitFor } from "@testing-library/dom";
import RecurringActionItems from "../RecurringActionItems";

const mocks = vi.hoisted(() => ({
  useRecurringActionItems: vi.fn(),
  useCreateRecurringActionItem: vi.fn(),
  useUpdateRecurringActionItem: vi.fn(),
  useDeleteRecurringActionItem: vi.fn(),
}));

vi.mock("../../hooks/useRecurringActionItems", () => mocks);

vi.mock("../common/RecurrencePatternBuilder", () => ({
  default: () => <div data-testid="recurrence-pattern-builder" />,
}));

vi.mock("antd", async () => {
  const React = await import("react");
  const actual = await vi.importActual("antd");

  return {
    ...actual,
    Table: ({ dataSource = [], columns, locale }) => (
      <div data-testid="recurring-table">
        {dataSource.length
          ? dataSource.map((row) => (
              <div key={row.id}>
                <span>{row.text}</span>
                {columns.map((column) => (
                  <div key={column.key}>
                    {column.render
                      ? column.render(row[column.dataIndex], row)
                      : null}
                  </div>
                ))}
              </div>
            ))
          : locale?.emptyText}
      </div>
    ),
    Modal: ({ open, children, onOk }) =>
      open ? (
        <div role="dialog">
          {children}
          <button onClick={onOk}>Save</button>
        </div>
      ) : null,
    Form: {
      ...actual.Form,
    },
  };
});

const renderWidget = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RecurringActionItems />
    </QueryClientProvider>,
  );

describe("RecurringActionItems", () => {
  it("mounts with live recurring items", () => {
    mocks.useRecurringActionItems.mockReturnValue({
      data: [
        {
          id: "r1",
          text: "Prepare weekly agenda",
          description: "Review open commitments",
          recurrencePattern: "weekly",
          isActive: true,
          currentStreak: 3,
          totalCompleted: 8,
          totalMissed: 1,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mocks.useCreateRecurringActionItem.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mocks.useUpdateRecurringActionItem.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mocks.useDeleteRecurringActionItem.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    renderWidget();

    expect(
      screen.getByTestId("recurring-action-items-widget"),
    ).toBeInTheDocument();
    expect(screen.getByText("Prepare weekly agenda")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("shows the empty state", () => {
    mocks.useRecurringActionItems.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mocks.useCreateRecurringActionItem.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mocks.useUpdateRecurringActionItem.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mocks.useDeleteRecurringActionItem.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    renderWidget();

    expect(
      screen.getByText("No recurring action items yet"),
    ).toBeInTheDocument();
  });

  it("renders an API error with retry", async () => {
    const refetch = vi.fn();
    mocks.useRecurringActionItems.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error("Network failure"),
      refetch,
    });
    mocks.useCreateRecurringActionItem.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mocks.useUpdateRecurringActionItem.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mocks.useDeleteRecurringActionItem.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    renderWidget();

    fireEvent.click(screen.getByText("Retry"));
    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
  });

  it("pauses an active recurring item through the existing update API", () => {
    const mutate = vi.fn();
    mocks.useRecurringActionItems.mockReturnValue({
      data: [
        {
          id: "r1",
          text: "Weekly review",
          recurrencePattern: "weekly",
          isActive: true,
          currentStreak: 1,
          totalCompleted: 2,
          totalMissed: 0,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mocks.useCreateRecurringActionItem.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mocks.useUpdateRecurringActionItem.mockReturnValue({
      mutate,
      isPending: false,
    });
    mocks.useDeleteRecurringActionItem.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    renderWidget();

    fireEvent.click(
      screen.getByRole("button", { name: "Pause recurring item" }),
    );
    expect(mutate).toHaveBeenCalledWith(
      { id: "r1", data: { isActive: false } },
      expect.any(Object),
    );
  });
});
