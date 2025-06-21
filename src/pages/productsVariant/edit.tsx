import { Edit, useForm, useTable } from "@refinedev/antd";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Row,
  Col,
  Card,
  Image,
  Space,
  message,
} from "antd";
import { UploadOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const fixedSizes = ["S", "M", "L", "XL", "XXL"];

export const ProductVariantEdit = () => {
  const { id } = useParams();
  const { formProps, saveButtonProps, queryResult } = useForm({
    resource: "variants",
    action: "edit",
    id,
  });

  const { tableProps: productTableProps } = useTable({
    resource: "products",
    syncWithLocation: false,
    pagination: { pageSize: 1000 },
  });

  const [productTreeData, setProductTreeData] = useState([]);
  const [deletedPublicIds, setDeletedPublicIds] = useState<string[]>([]);

  useEffect(() => {
    if (queryResult?.data?.data) {
      const data = queryResult.data.data;
      const mainImage = data.images?.main
        ? [
            {
              uid: data.images.main.public_id,
              name: "main.jpg",
              status: "done",
              url: data.images.main.url,
              public_id: data.images.main.public_id,
            },
          ]
        : [];
      const hoverImage = data.images?.hover
        ? [
            {
              uid: data.images.hover.public_id,
              name: "hover.jpg",
              status: "done",
              url: data.images.hover.url,
              public_id: data.images.hover.public_id,
            },
          ]
        : [];
      const productImages = Array.isArray(data.images?.product)
        ? data.images.product.map((img: any, idx: number) => ({
            uid: img.public_id || idx,
            name: `product_${idx}.jpg`,
            status: "done",
            url: img.url,
            public_id: img.public_id,
          }))
        : [];
      const sizes = fixedSizes.map((size) => {
        const found = data.sizes?.find((s: any) => s.size === size);
        return { size, stock: found?.stock ?? 0 };
      });

      formProps.form?.setFieldsValue({
        productId: data.productId?._id || data.productId,
        productName: data.productId?.name || "",
        sku: data.sku,
        price: data.price,
        color: {
          colorName: data.color?.colorName || "",
          actualColor: data.color?.actualColor || "",
          baseColor: data.color?.baseColor || "",
        },
        images: { main: mainImage, hover: hoverImage, product: productImages },
        sizes,
      });
    }
  }, [queryResult]);

  const handleRemoveImage = (file: any, imageType: any) => {
    message.loading({ content: "Đang xóa ảnh...", key: "removeImage" });
    const publicId = file.public_id;
    if (publicId) {
      setDeletedPublicIds((prev) => [...prev, publicId]);
    }
    const currentImages = formProps.form?.getFieldValue(["images", imageType]) || [];
    const updatedImages = currentImages.filter((img: any) => img.uid !== file.uid);
    formProps.form?.setFieldsValue({
      images: {
        ...formProps.form?.getFieldValue("images"),
        [imageType]: updatedImages,
      },
    });
    message.success({ content: "Xóa ảnh thành công", key: "removeImage" });
  };

  const handleFinish = async (values: any) => {
    const formData = new FormData();

    // Thêm các trường thông thường
    formData.append("productId", values.productId);
    formData.append("sku", values.sku);
    formData.append("price", values.price);
    formData.append("color.colorName", values.color.colorName);
    formData.append("color.actualColor", values.color.actualColor);
    formData.append("color.baseColor", values.color.baseColor);

    // Thêm ảnh chính
    if (values.images?.main?.[0]?.originFileObj) {
      formData.append("images[main]", values.images.main[0].originFileObj);
    }

    // Thêm ảnh hover
    if (values.images?.hover?.[0]?.originFileObj) {
      formData.append("images[hover]", values.images.hover[0].originFileObj);
    }

    // Thêm ảnh sản phẩm
    if (Array.isArray(values.images?.product)) {
      values.images.product.forEach((img: any) => {
        if (img.originFileObj) {
          formData.append("images[product]", img.originFileObj);
        }
      });
    }

    // Thêm danh sách ảnh bị xóa
    deletedPublicIds.forEach((publicId) => {
      formData.append("deletedImages[]", publicId);
    });

    // Thêm sizes
    values.sizes.forEach((s: any, idx: any) => {
      formData.append(`sizes[${idx}][size]`, s.size);
      formData.append(`sizes[${idx}][stock]`, s.stock);
    });

    // Log FormData để debug
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      await formProps.onFinish?.(formData);
      setDeletedPublicIds([]);
      message.success("Cập nhật biến thể thành công");
    } catch (error) {
      console.error("Error updating variant:", error);
      message.error("Cập nhật biến thể thất bại");
      const err = error as { response?: { data?: { errors?: any[] } } };
      if (err?.response?.data?.errors) {
        const errors = err.response.data.errors.map((err) => ({
          name: err.path.split("."),
          errors: [err.message],
        }));
        formProps.form?.setFields(errors);
        formProps.form?.validateFields().catch(() => {
          // Validation errors are handled by the form UI
        });
      }
    }
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Card
        title="Chỉnh sửa Sản phẩm Variant"
        bordered
        // extra={
        //   <Button
        //     icon={<ReloadOutlined />}
        //     onClick={async () => {
        //       const res = await queryResult?.refetch();
        //       const data = res?.data?.data;
        //       if (data) {
        //         const mainImage = data.images?.main
        //           ? [
        //               {
        //                 uid: data.images.main.public_id,
        //                 name: "main.jpg",
        //                 status: "done",
        //                 url: data.images.main.url,
        //                 public_id: data.images.main.public_id,
        //               },
        //             ]
        //           : [];
        //         const hoverImage = data.images?.hover
        //           ? [
        //               {
        //                 uid: data.images.hover.public_id,
        //                 name: "hover.jpg",
        //                 status: "done",
        //                 url: data.images.hover.url,
        //                 public_id: data.images.hover.public_id,
        //               },
        //             ]
        //           : [];
        //         const productImages = Array.isArray(data.images?.product)
        //           ? data.images.product.map((img: any, idx: number) => ({
        //               uid: img.public_id || idx,
        //               name: `product_${idx}.jpg`,
        //               status: "done",
        //               url: img.url,
        //               public_id: img.public_id,
        //             }))
        //           : [];
        //         const sizes = fixedSizes.map((size) => {
        //           const found = data.sizes?.find((s: any) => s.size === size);
        //           return { size, stock: found?.stock ?? 0 };
        //         });

        //         formProps.form?.setFieldsValue({
        //           productId: data.productId?._id || data.productId,
        //           productName: data.productId?.name || "",
        //           sku: data.sku,
        //           price: data.price,
        //           color: {
        //             colorName: data.color?.colorName || "",
        //             actualColor: data.color?.actualColor || "",
        //             baseColor: data.color?.baseColor || "",
        //           },
        //           images: { main: mainImage, hover: hoverImage, product: productImages },
        //           sizes,
        //         });
        //       }
        //     }}
        //     type="default"
        //   >
        //     Làm mới
        //   </Button>
        // }
      >
        <Form {...formProps} layout="vertical" onFinish={handleFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Sản phẩm"
                name="productName"
                rules={[{ required: true }]}
              >
                <Input placeholder="Chọn sản phẩm"   disabled={true} />
              </Form.Item>
              <Form.Item
                label="Sản phẩm"
                name="productId"
                rules={[{ required: true }]}
                hidden
              >
              </Form.Item>
              
              <Form.Item label="SKU" name="sku" rules={[{ required: true }]}>
                <Input disabled={true} />
              </Form.Item>
              <Form.Item label="Giá" name="price" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên màu"
                name={["color", "colorName"]}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Màu thực tế"
                name={["color", "actualColor"]}
                rules={[{ required: true }]}
              >
                <Input type="color" />
              </Form.Item>
              <Form.Item
                label="Màu cơ bản"
                name={["color", "baseColor"]}
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn màu cơ bản">
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
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="Ảnh chính"
                name={["images", "main"]}
                valuePropName="fileList"
                getValueProps={(value) => ({
                  fileList: Array.isArray(value) ? value : value ? [value] : [],
                })}
                rules={[
                  { required: true, message: "Vui lòng tải lên ảnh chính" },
                ]}
              >
                <Space direction="vertical">
                  {formProps.form?.getFieldValue(["images", "main"])?.[0]
                    ?.url && (
                    <Space>
                      <Image
                        src={
                          formProps.form.getFieldValue(["images", "main"])[0]
                            .url
                        }
                        alt="Ảnh chính"
                        width={80}
                        style={{ borderRadius: 4 }}
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() =>
                          handleRemoveImage(
                            formProps.form?.getFieldValue(["images", "main"])?.[0],
                            "main"
                          )
                        }
                      />
                    </Space>
                  )}
                  <Upload
                    listType="picture"
                    maxCount={1}
                    beforeUpload={() => false}
                  >
                    <Button icon={<UploadOutlined />}>Tải lên</Button>
                  </Upload>
                </Space>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Ảnh hover"
                name={["images", "hover"]}
                valuePropName="fileList"
                getValueProps={(value) => ({
                  fileList: Array.isArray(value) ? value : value ? [value] : [],
                })}
                rules={[
                  { required: true, message: "Vui lòng tải lên ảnh hover" },
                ]}
              >
                <Space direction="vertical">
                  {formProps.form?.getFieldValue(["images", "hover"])?.[0]
                    ?.url && (
                    <Space>
                      <Image
                        src={
                          formProps.form.getFieldValue(["images", "hover"])[0]
                            .url
                        }
                        alt="Ảnh hover"
                        width={80}
                        style={{ borderRadius: 4 }}
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() =>
                          handleRemoveImage(
                            formProps.form?.getFieldValue([
                              "images",
                              "hover",
                            ])[0],
                            "hover"
                          )
                        }
                      />
                    </Space>
                  )}
                  <Upload
                    listType="picture"
                    maxCount={1}
                    beforeUpload={() => false}
                  >
                    <Button icon={<UploadOutlined />}>Tải lên</Button>
                  </Upload>
                </Space>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Ảnh sản phẩm"
                name={["images", "product"]}
                valuePropName="fileList"
                getValueProps={(value) => ({
                  fileList: Array.isArray(value) ? value : value ? [value] : [],
                })}
                rules={[
                  {
                    required: true,
                    message: "Vui lòng tải lên ít nhất một ảnh sản phẩm",
                  },
                ]}
              >
                <Space direction="vertical">
                  <Space wrap>
                    {Array.isArray(
                      formProps.form?.getFieldValue(["images", "product"])
                    ) &&
                      formProps.form
                        .getFieldValue(["images", "product"])
                        .map((img: any, idx: any) =>
                          img.url ? (
                            <Space
                              key={img.uid || idx}
                              direction="vertical"
                              align="center"
                            >
                              <Image
                                src={img.url}
                                alt={`Ảnh sản phẩm ${idx + 1}`}
                                width={60}
                                style={{ borderRadius: 4 }}
                              />
                              <Button
                                icon={<DeleteOutlined />}
                                danger
                                onClick={() =>
                                  handleRemoveImage(img, "product")
                                }
                              />
                            </Space>
                          ) : null
                        )}
                  </Space>
                  <Upload
                    listType="picture"
                    multiple
                    beforeUpload={() => false}
                  >
                    <Button icon={<UploadOutlined />}>Tải lên</Button>
                  </Upload>
                </Space>
              </Form.Item>
            </Col>
          </Row>
          <Card type="inner" title="Kích thước" style={{ marginTop: 16 }}>
            {fixedSizes.map((size, index) => (
              <Row gutter={16} key={index}>
                <Col span={12}>
                  <Form.Item
                    label={`Kích thước (${size})`}
                    name={["sizes", index, "size"]}
                    initialValue={size}
                  >
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={`Số lượng (${size})`}
                    name={["sizes", index, "stock"]}
                    rules={[
                      {
                        required: true,
                        message: `Nhập số lượng cho size ${size}`,
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      placeholder="Số lượng"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            ))}
          </Card>
        </Form>
      </Card>
    </Edit>
  );
};
