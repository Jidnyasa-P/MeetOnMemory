import React, { useState } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  message,
  Tooltip,
  Space,
  Empty,
  Alert,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FireOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import {
  useRecurringActionItems,
  useCreateRecurringActionItem,
  useUpdateRecurringActionItem,
  useDeleteRecurringActionItem,
} from "../../hooks/useRecurringActionItems";
import RecurrencePatternBuilder from "../common/RecurrencePatternBuilder";

const RecurringActionItems = () => {
  const {
    data: recurringItems = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useRecurringActionItems();

  const createMutation = useCreateRecurringActionItem();
  const updateMutation = useUpdateRecurringActionItem();
  const deleteMutation = useDeleteRecurringActionItem();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id, {
      onSuccess: () => message.success("Deleted successfully"),
      onError: (mutationError) =>
        message.error(mutationError?.message || "Unable to delete item"),
    });
  };

  const handleToggleActive = (record) => {
    updateMutation.mutate(
      {
        id: record.id,
        data: { isActive: !record.isActive },
      },
      {
        onSuccess: () =>
          message.success(
            record.isActive ? "Paused successfully" : "Resumed successfully",
          ),
        onError: (mutationError) =>
          message.error(mutationError?.message || "Unable to update item"),
      },
    );
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingItem) {
        updateMutation.mutate(
          { id: editingItem.id, data: values },
          {
            onSuccess: () => {
              message.success("Updated successfully");
              setIsModalVisible(false);
            },
            onError: (mutationError) =>
              message.error(mutationError?.message || "Unable to update item"),
          },
        );
      } else {
        createMutation.mutate(values, {
          onSuccess: () => {
            message.success("Created successfully");
            setIsModalVisible(false);
          },
          onError: (mutationError) =>
            message.error(mutationError?.message || "Unable to create item"),
        });
      }
    } catch {
      // Ant Design displays field-level validation errors.
    }
  };

  const columns = [
    {
      title: "Task",
      dataIndex: "text",
      key: "text",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          {record.description ? (
            <div style={{ fontSize: 12, color: "#888" }}>
              {record.description}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Pattern",
      dataIndex: "recurrencePattern",
      key: "recurrencePattern",
      render: (pattern) => (
        <Tag color="blue">{String(pattern || "unknown").toUpperCase()}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "default"}>
          {isActive ? "ACTIVE" : "PAUSED"}
        </Tag>
      ),
    },
    {
      title: "Streak",
      dataIndex: "currentStreak",
      key: "currentStreak",
      render: (streak = 0) => (
        <Tooltip title={`Current streak: ${streak}`}>
          <Space>
            <FireOutlined
              style={{ color: streak > 0 ? "#fa8c16" : "#d9d9d9" }}
            />
            <span
              style={{
                color: streak > 0 ? "#fa8c16" : "#d9d9d9",
                fontWeight: "bold",
              }}
            >
              {streak}
            </span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: "Stats",
      key: "stats",
      render: (_, record) => (
        <div style={{ fontSize: 12, color: "#666" }}>
          <div>Completed: {record.totalCompleted || 0}</div>
          <div>Missed: {record.totalMissed || 0}</div>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button
            icon={
              record.isActive ? <PauseCircleOutlined /> : <PlayCircleOutlined />
            }
            onClick={() => handleToggleActive(record)}
            size="small"
            loading={
              updateMutation.isPending &&
              updateMutation.variables?.id === record.id
            }
            aria-label={
              record.isActive ? "Pause recurring item" : "Resume recurring item"
            }
          >
            {record.isActive ? "Pause" : "Resume"}
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            disabled={isMutating}
            aria-label="Edit recurring item"
          />
          <Popconfirm
            title="Delete this recurring item?"
            description="Future recurring instances will no longer be generated."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
              disabled={isMutating}
              aria-label="Delete recurring item"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <section
      aria-label="Recurring Action Items"
      data-testid="recurring-action-items-widget"
      style={{
        padding: 24,
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ marginBottom: 4 }}>Recurring Action Items</h2>
          <div style={{ color: "#666", fontSize: 13 }}>
            Keep recurring commitments visible and pause them when needed.
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Recurring Item
        </Button>
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="Unable to load recurring action items"
          description={error?.message || "Please try again."}
          action={
            <Button size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Table
        columns={columns}
        dataSource={recurringItems}
        rowKey="id"
        loading={isLoading}
        locale={{
          emptyText: (
            <Empty
              description="No recurring action items yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Create your first recurring item
              </Button>
            </Empty>
          ),
        }}
        pagination={{ pageSize: 8, hideOnSinglePage: true }}
      />

      <Modal
        title={editingItem ? "Edit Recurring Item" : "Create Recurring Item"}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="Save"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="text"
            label="Task Description"
            rules={[{ required: true, message: "Enter a task description" }]}
          >
            <Input maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="description" label="Details">
            <Input.TextArea maxLength={2000} showCount />
          </Form.Item>
          <Form.Item
            name="meetingSeriesId"
            label="Meeting Series ID"
            rules={[{ required: true, message: "Enter a meeting series ID" }]}
          >
            <Input placeholder="Enter meeting series ID" />
          </Form.Item>
          <Form.Item
            name="recurrencePattern"
            label="Recurrence"
            rules={[{ required: true, message: "Select a recurrence pattern" }]}
          >
            <Input placeholder="daily, weekly, biweekly, or monthly" />
          </Form.Item>
          <Form.Item name="patternConfig" label="Pattern Configuration">
            <RecurrencePatternBuilder />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
};

export default RecurringActionItems;
