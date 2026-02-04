"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";




/**
 * Grid a 4 columnas iguales, usando todo el ancho disponible.
 * Padding horizontal: 4rem (px-[4rem]).
 * Cada columna contiene un Card basado en tu snippet (sin max-w-sm).
 */
export default function Gallery() {
  return (
    <section aria-label="Mini galería" className="w-full px-[4rem] py-20">
      <div className="grid grid-cols-4 gap-8">
        {/* Columna 1 */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
            <div className="mt-2">
              <Button variant="link">Sign Up</Button>
            </div>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email-1">Email</Label>
                  <Input
                    id="email-1"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password-1">Password</Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input id="password-1" type="password" required />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </CardFooter>
        </Card>

        {/* Columna 2 */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
            <div className="mt-2">
              <Button variant="link">Sign Up</Button>
            </div>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email-2">Email</Label>
                  <Input
                    id="email-2"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password-2">Password</Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input id="password-2" type="password" required />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </CardFooter>
        </Card>

        {/* Columna 3 */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
            <div className="ml-auto">
              <Button variant="link">Sign Up</Button>
            </div>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email-3">Email</Label>
                  <Input
                    id="email-3"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password-3">Password</Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input id="password-3" type="password" required />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </CardFooter>
        </Card>

        {/* Columna 4 */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
            <div className="ml-auto">
              <Button variant="link">Sign Up</Button>
            </div>
          </CardHeader>
          <CardContent>
            <form>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email-4">Email</Label>
                  <Input
                    id="email-4"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password-4">Password</Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input id="password-4" type="password" required />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
