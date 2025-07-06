"use client"
import React, { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from './ui/button';
import { IoMdAdd } from 'react-icons/io';
import { Input } from './ui/input';
import { Label } from './ui/label';
import axios from 'axios';


interface JobFormData {
    label: string;
    payload: string;
    priority: number;
    timeout: number;
    delay: number;
}

interface JobResponse {
    jobs: any;
}

const AddJob: React.FC = () => {
    const [formData, setFormData] = useState<JobFormData>({
        label: '',
        payload: '',
        priority: 0,
        timeout: 0,
        delay: 0
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/add', formData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data: JobResponse = response.data;
            console.log('Job added successfully:', data);

            // Reset form
            setFormData({
                label: '',
                payload: '',
                priority: 0,
                timeout: 0,
                delay: 0
            });

            // Close dialog
            setIsOpen(false);

            window.location.reload();



        } catch (error) {
            console.error('Error adding job:', error);
            alert('Failed to add job. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <IoMdAdd />
                    New Job
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create new Job</DialogTitle>
                </DialogHeader>
                <div className="w-full py-5">
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="label">Name</Label>
                                <Input
                                    id="label"
                                    name="label"
                                    type="text"
                                    placeholder="script-test"
                                    value={formData.label}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="payload">Payload</Label>
                                <Input
                                    id="payload"
                                    name="payload"
                                    type="text"
                                    placeholder="ls -a"
                                    value={formData.payload}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="priority">
                                    Priority
                                    <p className='text-muted-foreground text-xs'>optional</p>
                                </Label>
                                <Input
                                    id="priority"
                                    name="priority"
                                    type="number"
                                    placeholder="1"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                />
                            </div>




                            <div className="grid gap-3">
                                <Label htmlFor="timeout">
                                    Timeout (ms)
                                    <p className='text-muted-foreground text-xs'>optional</p>
                                </Label>
                                <Input
                                    id="timeout"
                                    name="timeout"
                                    type="number"
                                    placeholder="5000"
                                    value={formData.timeout}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="delay">
                                    Delay (ms)
                                    <p className='text-muted-foreground text-xs'>optional</p>
                                </Label>
                                <Input
                                    id="delay"
                                    name="delay"
                                    type="number"
                                    placeholder="0"
                                    value={formData.delay}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                className='px-8'
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Adding...' : 'Add Job'}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddJob;