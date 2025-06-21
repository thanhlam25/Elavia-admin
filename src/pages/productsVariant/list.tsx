import { DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import { DeleteButton, EditButton, List, ShowButton } from "@refinedev/antd";
import { BaseRecord, useCustom, useCustomMutation } from "@refinedev/core";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Space, Table, Image, Input, Button, Select, Popover, Popconfirm, message, Tag } from "antd";
import { useState } from "react";

export const ProductVariantList = () => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [sorter, setSorter] = useState<{ field?: string; order?: string }>({});
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [baseColors, setBaseColors] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [skuSearch, setSkuSearch] = useState("");
  const [filters, setFilters] = useState<{
    _priceMin?: string;
    _priceMax?: string;
    _baseColors?: string;
    _name?: string;
    _sku?: string;
  }>({});

  const { data, isLoading, isError, refetch } = useCustom({
    url: "/admin/variants",
    method: "get",
    config: {
      query: {
        _page: pagination.current,
        _limit: pagination.pageSize,
        _sort: sorter.field,
        _order: sorter.order,
        ...(filters._priceMin && filters._priceMin !== ""
          ? { _priceMin: filters._priceMin }
          : {}),
        ...(filters._priceMax && filters._priceMax !== ""
          ? { _priceMax: filters._priceMax }
          : {}),
        ...(filters._baseColors && filters._baseColors !== ""
          ? { _baseColors: filters._baseColors }
          : {}),
        ...(filters._name && filters._name !== ""
          ? { _name: filters._name }
          : {}),
        ...(filters._sku && filters._sku !== "" ? { _sku: filters._sku } : {}),
      },
    },
  });

  const tableData = data?.data?.data || [];
  const total = data?.data?.total || 0;

  const handleTableChange = (newPagination: any, _: any, sorterConfig: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
    if (sorterConfig && sorterConfig.field) {
      setSorter({
        field: Array.isArray(sorterConfig.field)
          ? sorterConfig.field.join(".")
          : sorterConfig.field,
        order: sorterConfig.order === "ascend" ? "asc" : "desc",
      });
    } else {
      setSorter({});
    }
  };

  const handleSearch = () => {
    setFilters({
      _priceMin: priceMin.trim(),
      _priceMax: priceMax.trim(),
      _baseColors: baseColors,
      _name: nameSearch.trim(),
      _sku: skuSearch.trim(),
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleExportExcel = () => {
    const excelData = tableData.map((variant: any) => ({
      "Sản phẩm": variant?.productId?.name || "",
      "SKU": variant?.sku,
      "Màu": variant?.color?.colorName || "",
      "Giá": variant?.price,
    }));

    // Tạo worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // ✅ Tự động tính độ rộng cột (auto-fit)
    const colWidths = Object.keys(excelData[0] || {}).map((key) => ({
      wch: Math.max(key.length + 2, 15), // chiều rộng theo tiêu đề
    }));
    worksheet["!cols"] = colWidths;

    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách");

    // Xuất ra file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "variants.xlsx");
  };

  // Thêm state quản lý các dòng được chọn
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Hook xử lý xoá hàng loạt
  const { mutateAsync: xoaNhieuSanPham } = useCustomMutation();

  // Hàm xử lý xoá hàng loạt
  const handleBulkDelete = async () => {
    try {
      await xoaNhieuSanPham({
        url: "/admin/variants/bulk-delete",
        method: "delete",
        values: {
          ids: selectedRowKeys
        },
      });
      
      message.success(`Đã xoá ${selectedRowKeys.length} sản phẩm`);
      setSelectedRowKeys([]);
      refetch(); 
    } catch (error) {
      message.error('Có lỗi xảy ra khi xoá sản phẩm');
    }
  };

  // Cấu hình rowSelection cho Table
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    }
  };

  return (
    <List canCreate={false}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        {/* Phần tìm kiếm bên trái */}
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            placeholder="Tên sản phẩm"
            value={nameSearch}
            allowClear
            onChange={(e) => setNameSearch(e.target.value)}
            style={{ width: 160 }}
          />
          <Input
            placeholder="Mã sản phẩm (SKU)"
            value={skuSearch}
            allowClear
            onChange={(e) => setSkuSearch(e.target.value)}
            style={{ width: 180 }}
          />
          <Input
            placeholder="Giá thấp nhất"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            style={{ width: 140 }}
            type="number"
            min={0}
          />
          <Input
            placeholder="Giá cao nhất"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            style={{ width: 140 }}
            type="number"
            min={0}
          />
          <Select
            placeholder="Chọn màu cơ bản"
            allowClear
            style={{ width: 160 }}
            value={baseColors || undefined}
            onChange={(value) => setBaseColors(value || "")}
          >
            <Select.Option value="black">Đen</Select.Option>
            <Select.Option value="white">Trắng</Select.Option>
            <Select.Option value="blue">Xanh dương</Select.Option>
            <Select.Option value="yellow">Vàng</Select.Option>
            <Select.Option value="pink">Hồng</Select.Option>
            <Select.Option value="red">Đỏ</Select.Option>
            <Select.Option value="gray">Xám</Select.Option>
            <Select.Option value="beige">Be</Select.Option>
            <Select.Option value="brown">Nâu</Select.Option>
            <Select.Option value="green">Xanh lá</Select.Option>
            <Select.Option value="orange">Cam</Select.Option>
            <Select.Option value="purple">Tím</Select.Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>
            Tìm kiếm
          </Button>
        </div>

        {/* Phần nút hành động bên phải */}
        <div style={{ display: "flex", gap: 8 }}>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Bạn có chắc muốn xoá ${selectedRowKeys.length} sản phẩm đã chọn?`}
              onConfirm={handleBulkDelete}
            >
              <Button danger icon={<DeleteOutlined />}>
                Xoá {selectedRowKeys.length} biến thể
              </Button>
            </Popconfirm>
          )}
          <Button type="primary" onClick={handleExportExcel}>
            Xuất Excel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div>Đang tải...</div>
      ) : isError ? (
        <div>Lỗi khi tải dữ liệu</div>
      ) : (
        <Table
          rowSelection={rowSelection}
          dataSource={tableData}
          rowKey="_id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `Tổng ${total} bản ghi`,
          }}
          onChange={handleTableChange}
        >
          <Table.Column
            title="STT"
            key="index"
            align="center"
            render={(_, __, index) =>
              pagination.pageSize * (pagination.current - 1) + index + 1
            }
            width={70}
          />
          <Table.Column
            dataIndex={["productId", "name"]}
            title="Sản phẩm"
            sorter={true}
            render={(value) => value || "Không xác định"}
          />
          <Table.Column dataIndex="sku" title="SKU" sorter={true} />
          <Table.Column
            title="Màu"
            sorter={{
              compare: (a, b) => {
                const nameA = a.color?.colorName || "";
                const nameB = b.color?.colorName || "";
                return nameA.localeCompare(nameB);
              },
              multiple: 1,
            }}
            render={(_, record) => {
              const color = record.color || {};
              return (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 24,
                      height: 24,
                      backgroundColor: color.actualColor || "#ccc",
                      border: "1px solid #ddd",
                      borderRadius: 2,
                    }}
                  />
                  <span>{color.colorName || "Không có"}</span>
                </span>
              );
            }}
          />
        
        <Table.Column
          title="Tồn kho"
          align="center"
          sorter={(a, b) => {
            const getTotalStock = (record: any) => {
              return Array.isArray(record.sizes) 
                ? record.sizes.reduce((sum: any, size: any) => sum + (size.stock || 0), 0)
                : 0;
            };
            return getTotalStock(a) - getTotalStock(b);
          }}
          render={(_, record) => {
            const sizes = Array.isArray(record.sizes) ? record.sizes : [];
            const totalStock = sizes.reduce((sum, size) => sum + (size.stock || 0), 0);
            
            const content = (
              <div>
                {sizes.map((size) => (
                  <div key={size.size} style={{ marginBottom: 4 }}>
                    Size {size.size}: <b>{size.stock}</b>
                  </div>
                ))}
              </div>
            );

            return (
              <Popover 
                content={content}
                title="Chi tiết tồn kho"
                trigger="click"
              >
                <span style={{ cursor: 'pointer', color: totalStock > 0 ? '#1890ff' : '#ff4d4f' }}>
                  {totalStock > 0 ? totalStock : "Hết hàng"}
                </span>
              </Popover>
            );
          }}
        />
          <Table.Column 
            dataIndex="price" 
            title="Giá" 
            sorter={true}
            render={(value) => {
              return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(value);
            }}
          />
          <Table.Column
            dataIndex="status"
            title="Trạng thái"
            sorter={true}
            render={(status) => (
              <Tag color={status ? "green" : "red"}>
                {status ? "Hoạt động" : "Không hoạt động"}
              </Tag>
            )}
          />
          <Table.Column
            dataIndex={["images", "main", "url"]}
            title="Ảnh chính"
            render={(value) => <Image src={value} width={50} />}
          />

          <Table.Column
            dataIndex="createdAt"
            title="Ngày tạo"
            width={120}
            sorter={true}
            render={(value) =>
              value
                ? new Date(value).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : ""
            }
          />
          <Table.Column
            title="Hành động"
            dataIndex="actions"
            render={(_, record: BaseRecord) => (
              <Space>
                <EditButton hideText size="small" recordItemId={record._id} />
                <ShowButton hideText size="small" recordItemId={record._id} />
                <DeleteButton
                  hideText
                  size="small"
                  recordItemId={record._id}
                  onSuccess={() => refetch()}
                />
              </Space>
            )}
          />
        </Table>
      )}
    </List>
  );
};
