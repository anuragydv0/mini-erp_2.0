import apiClient from "./client";
import { ErpProduct } from "../types/erp";

export const productApi = {
  getProducts: () => apiClient.get("/products") as Promise<any>,
  createProduct: (data: Partial<ErpProduct>) => apiClient.post("/products", data) as Promise<any>,
  updateProduct: (id: string, data: any) => apiClient.put(`/products/${id}`, data) as Promise<any>,
  getProductById: (id: string) => apiClient.get(`/products/${id}`) as Promise<any>,
};
