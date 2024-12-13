import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { UserCartDTO } from 'src/dto/userCart.dto';
import { User } from 'src/schemas/User.model';
import { CreateUserDTO } from '../auth/dto/createUser.dto';

export interface CartItem {
  id: string;
  qty: number;
}

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async createUser(createUserDTO: CreateUserDTO) {
    const newUser = new this.userModel(createUserDTO);
    newUser.password = await bcrypt.hash(newUser.password, 12);
    return newUser.save();
  }

  async getUserRole(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    return user.role;
  }
  async getUserCart(email: string): Promise<CartItem[]> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    return user.cart;
  }
  async updateUserCart(userEmail: string, userCartDTO: UserCartDTO) {
    const user = await this.userModel.findOne({ email: userEmail });
    if (!user) {
      throw new Error('User not found');
    }

    const existingProduct = user.cart.find(
      (item) => item.id === userCartDTO.productId,
    );

    if (existingProduct) {
      existingProduct.qty = userCartDTO.qty;
    } else {
      user.cart.push({
        id: userCartDTO.productId,
        qty: userCartDTO.qty,
      });
    }

    await user.save();
    return user;
  }
  async removeProductFromCart(
    userEmail: string,
    productId: string,
  ): Promise<CartItem[]> {
    const user = await this.userModel.findOne({ email: userEmail });

    if (!user) {
      throw new Error('User not found');
    }

    const productIndex = user.cart.findIndex((item) => item.id === productId);

    if (productIndex === -1) {
      throw new Error('Product not found in cart');
    }

    user.cart.splice(productIndex, 1);

    await user.save();
    return user.cart;
  }
  async getAllUsers() {
    return this.userModel.find();
  }
}