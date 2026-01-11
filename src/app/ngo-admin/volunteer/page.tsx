'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import React from 'react';
import VolunteerApplications from './_components/volunteer-applications';
import OpportunityManagement from "./_components/opportunity-management";

const VolunteerPage = () => {

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gönüllülük</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Yeni İlan Oluştur
        </Button>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList>
          <TabsTrigger value="applications">Başvurular</TabsTrigger>
          <TabsTrigger value="opportunities">İlan Yönetimi</TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="mt-4">
            <VolunteerApplications />
        </TabsContent>
        <TabsContent value="opportunities" className="mt-4">
            <OpportunityManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VolunteerPage;
